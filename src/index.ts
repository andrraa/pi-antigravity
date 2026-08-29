import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Credential = Record<string, unknown>;
type AuthStore = Record<string, Credential>;

const agentDir = join(homedir(), ".pi", "agent");
const authPath = join(agentDir, "auth.json");
const accountsPath = join(agentDir, "antigravity-accounts.json");

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try { return JSON.parse(await readFile(path, "utf8")) as T; }
  catch { return fallback; }
}

async function saveJson(path: string, value: unknown): Promise<void> {
  await mkdir(agentDir, { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function describe(credential: Credential): string {
  return typeof credential.email === "string" ? credential.email : "Google account";
}

export default function (pi: ExtensionAPI): void {
  pi.registerCommand("antigravity.account", {
    description: "Save, list, or switch Antigravity accounts",
    handler: async (args, ctx) => {
      const [action, name] = args.trim().split(/\s+/, 2);
      const accounts = await readJson<Record<string, Credential>>(accountsPath, {});

      if (action === "save" && name) {
        const auth = await readJson<AuthStore>(authPath, {});
        if (!auth.antigravity) {
          ctx.ui.notify("Login dulu dengan /login antigravity", "warning");
          return;
        }
        accounts[name] = auth.antigravity;
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`Akun ${name} disimpan (${describe(auth.antigravity)})`);
        return;
      }

      if (action === "list") {
        const entries = Object.entries(accounts);
        ctx.ui.notify(entries.length ? entries.map(([key, value]) => `${key}: ${describe(value)}`).join("\n") : "Belum ada akun tersimpan");
        return;
      }

      if (action === "rename" && name) {
        const rest = args.trim().split(/\s+/).slice(2).join(" ");
        if (!rest) {
          ctx.ui.notify("Pakai: /antigravity.account rename <nama_lama> <nama_baru>", "warning");
          return;
        }
        if (!accounts[name]) {
          ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
          return;
        }
        accounts[rest] = accounts[name];
        delete accounts[name];
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`Akun ${name} → ${rest}`);
        return;
      }

      if ((action === "delete" || action === "remove" || action === "rm") && name) {
        if (!accounts[name]) {
          ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
          return;
        }
        delete accounts[name];
        await saveJson(accountsPath, accounts);
        ctx.ui.notify(`Akun ${name} berhasil dihapus`);
        return;
      }

      if (action === "use" && name) {
        if (!accounts[name]) {
          ctx.ui.notify(`Akun tidak ditemukan: ${name}`, "warning");
          return;
        }
        const auth = await readJson<AuthStore>(authPath, {});
        auth.antigravity = accounts[name];
        await saveJson(authPath, auth);
        ctx.ui.notify(`Akun ${name} aktif. Jalankan /reload atau restart Pi agar token dipakai.`);
        return;
      }

      ctx.ui.notify("Pakai: /antigravity.account save <nama> | list | use <nama> | rename <lama> <baru> | delete <nama>", "warning");
    },
  });
}
