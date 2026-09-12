import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { loginAntigravity } from "../auth/index.js";
import { fetchAccountUsage } from "../usage/index.js";
import type { AntigravityOAuthCredentials } from "../types/types.js";

type Credential = AntigravityOAuthCredentials & Record<string, unknown>;
type AuthStore = Record<string, Credential>;

const agentDir = join(homedir(), ".pi", "agent");
const authPath = join(agentDir, "auth.json");
const accountsPath = join(agentDir, "antigravity-accounts.json");

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function saveJson(path: string, value: unknown): Promise<void> {
  await mkdir(agentDir, { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function describe(credential: Credential): string {
  return typeof credential.email === "string" ? credential.email : "Google account";
}

function isSameAccount(a?: Credential, b?: Credential): boolean {
  if (!a || !b) return false;
  if (a.email && b.email && a.email === b.email) return true;
  if (a.access && b.access && a.access === b.access) return true;
  if (a.refresh && b.refresh && a.refresh === b.refresh) return true;
  return false;
}

async function switchAccount(name: string, accounts: Record<string, Credential>, ctx: ExtensionCommandContext): Promise<boolean> {
  if (!accounts[name]) {
    ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
    return false;
  }

  const auth = await readJson<AuthStore>(authPath, {});
  auth.antigravity = accounts[name];
  await saveJson(authPath, auth);

  ctx.ui.notify(`✓ Mengaktifkan akun "${name}" (${describe(accounts[name])})...`);

  // Auto-reload Pi session so newly selected credentials take effect immediately
  if (typeof ctx.reload === "function") {
    await ctx.reload();
  } else {
    ctx.ui.notify("Jalankan /reload atau restart Pi agar perubahan token aktif.", "info");
  }
  return true;
}

export function registerAccountCommands(pi: ExtensionAPI): void {
  pi.registerCommand("antigravity.account", {
    description: "Manage, switch, login, or inspect Antigravity accounts",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/).filter(Boolean);
      const action = parts[0]?.toLowerCase();
      const name = parts[1];

      const accounts = await readJson<Record<string, Credential>>(accountsPath, {});
      const auth = await readJson<AuthStore>(authPath, {});
      const currentAuth = auth.antigravity;

      // 1. Direct interactive picker if no arguments provided
      if (!action) {
        const entries = Object.entries(accounts);
        if (!entries.length) {
          ctx.ui.notify("Belum ada akun tersimpan. Gunakan /antigravity.account login <nama> atau /antigravity.account save <nama>", "warning");
          return;
        }

        const options = entries.map(([key, value]) => {
          const active = isSameAccount(currentAuth, value) ? " (active)" : "";
          return `${key}: ${describe(value)}${active}`;
        });

        const selected = await ctx.ui.select("Pilih akun Antigravity aktif:", options);
        if (!selected) return;

        const chosenKey = selected.split(":")[0]?.trim();
        if (chosenKey) {
          await switchAccount(chosenKey, accounts, ctx);
        }
        return;
      }

      // 2. Direct login to alias
      if (action === "login") {
        const targetName = name;
        if (!targetName) {
          ctx.ui.notify("Pakai: /antigravity.account login <nama>", "warning");
          return;
        }

        ctx.ui.notify(`Memulai Google OAuth untuk akun "${targetName}"...`);
        try {
          const creds = await loginAntigravity({
            onAuth: (info) => {
              ctx.ui.notify(`Buka URL otentikasi di browser:\n${info.url}`);
            },
            onPrompt: async (info) => {
              const res = await ctx.ui.input(info.message, info.placeholder);
              return res ?? "";
            },
            onDeviceCode: (info) => {
              ctx.ui.notify(`Device code: ${info.userCode} (URL: ${info.verificationUri})`);
            },
            onSelect: async (prompt) => {
              const labels = prompt.options.map((o) => o.label);
              const res = await ctx.ui.select(prompt.message, labels);
              const found = prompt.options.find((o) => o.label === res);
              return found?.id ?? prompt.options[0]?.id ?? "";
            },
          });

          // Save to auth.json
          auth.antigravity = creds;
          await saveJson(authPath, auth);

          // Save to accounts list
          accounts[targetName] = creds;
          await saveJson(accountsPath, accounts);

          ctx.ui.notify(`✓ Berhasil login & menyimpan akun "${targetName}" (${describe(creds)})`);

          if (typeof ctx.reload === "function") {
            await ctx.reload();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          ctx.ui.notify(`Login gagal: ${msg}`, "error");
        }
        return;
      }

      // 3. Save currently active credentials
      if (action === "save" && name) {
        if (!currentAuth) {
          ctx.ui.notify("Login dulu dengan /login antigravity atau /antigravity.account login <nama>", "warning");
          return;
        }
        accounts[name] = currentAuth;
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`✓ Akun "${name}" disimpan (${describe(currentAuth)})`);
        return;
      }

      // 4. List accounts with active indicator
      if (action === "list" || action === "ls") {
        const entries = Object.entries(accounts);
        if (!entries.length) {
          ctx.ui.notify("Belum ada akun tersimpan");
          return;
        }

        const lines = entries.map(([key, value]) => {
          const isActive = isSameAccount(currentAuth, value);
          const bullet = isActive ? "● [active]" : "○";
          return `${bullet} ${key}: ${describe(value)}`;
        });
        ctx.ui.notify(`Daftar Akun Antigravity:\n${lines.join("\n")}`);
        return;
      }

      // 5. Check multi-account usage/quotas simultaneously
      if (action === "usage" || action === "quota") {
        const entries = Object.entries(accounts);
        if (!entries.length) {
          ctx.ui.notify("Belum ada akun tersimpan untuk dicek kuotanya", "warning");
          return;
        }

        ctx.ui.notify(`Mengecek kuota untuk ${entries.length} akun...`);
        const results = await Promise.allSettled(
          entries.map(async ([key, cred]) => {
            const token = typeof cred.access === "string" ? cred.access : undefined;
            if (!token) return { key, error: "No token" };
            const apiKey = cred.projectId ? `${token}:${String(cred.projectId)}` : token;
            const usage = await fetchAccountUsage(apiKey);
            return { key, cred, usage };
          })
        );

        const summaryLines: string[] = ["=== Multi-Account Quota Status ==="];
        for (const res of results) {
          if (res.status === "rejected") {
            summaryLines.push(`\n[!] Gagal mengambil kuota`);
            continue;
          }
          const item = res.value;
          if ("error" in item) {
            summaryLines.push(`\n[!] ${item.key}: ${item.error}`);
            continue;
          }
          const { key, cred, usage } = item;
          const isActive = isSameAccount(currentAuth, cred) ? " (active)" : "";
          const email = describe(cred);
          summaryLines.push(`\n● ${key}${isActive} [${email}] - Tier: ${usage.planLabel || "Standard"}`);

          if (usage.groups.length) {
            for (const g of usage.groups) {
              for (const b of g.buckets) {
                const rem = Math.round(b.remainingFraction * 100);
                summaryLines.push(`   ${b.displayName}: ${rem}% left`);
              }
            }
          } else {
            // Pick top models
            const flash = usage.models.find((m) => m.modelId.includes("flash"));
            const pro = usage.models.find((m) => m.modelId.includes("pro"));
            const claude = usage.models.find((m) => m.modelId.includes("claude"));
            if (flash && flash.remainingFraction !== undefined) {
              summaryLines.push(`   Gemini Flash: ${Math.round(flash.remainingFraction * 100)}% left`);
            }
            if (pro && pro.remainingFraction !== undefined) {
              summaryLines.push(`   Gemini Pro: ${Math.round(pro.remainingFraction * 100)}% left`);
            }
            if (claude && claude.remainingFraction !== undefined) {
              summaryLines.push(`   Claude: ${Math.round(claude.remainingFraction * 100)}% left`);
            }
          }
        }

        ctx.ui.notify(summaryLines.join("\n"));
        return;
      }

      // 6. Switch / use account
      if ((action === "use" || action === "switch") && name) {
        await switchAccount(name, accounts, ctx);
        return;
      }

      // 7. Rename account alias
      if (action === "rename" && name) {
        const newName = parts[2];
        if (!newName) {
          ctx.ui.notify("Pakai: /antigravity.account rename <nama_lama> <nama_baru>", "warning");
          return;
        }
        if (!accounts[name]) {
          ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
          return;
        }
        accounts[newName] = accounts[name];
        delete accounts[name];
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`✓ Akun "${name}" diubah namanya menjadi "${newName}"`);
        return;
      }

      // 8. Delete account
      if ((action === "delete" || action === "remove" || action === "rm") && name) {
        if (!accounts[name]) {
          ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
          return;
        }
        delete accounts[name];
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`✓ Akun "${name}" berhasil dihapus`);
        return;
      }

      // Help message
      ctx.ui.notify(
        "Panduan /antigravity.account:\n" +
        "• (tanpa argumen)           : Buka menu pilihan interaktif TUI\n" +
        "• login <nama>              : Login akun baru Google & langsung simpan\n" +
        "• use <nama>                : Ganti akun aktif secara instan\n" +
        "• list                      : Tampilkan daftar akun & akun aktif\n" +
        "• usage                     : Cek status kuota semua akun sekaligus\n" +
        "• save <nama>               : Simpan login aktif saat ini ke alias\n" +
        "• rename <lama> <baru>      : Ubah nama alias akun\n" +
        "• delete <nama>             : Hapus akun dari daftar",
        "warning"
      );
    },
  });
}
