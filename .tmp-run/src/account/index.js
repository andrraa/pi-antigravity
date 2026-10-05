import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { getApiKey, loginAntigravity, refreshAntigravityToken } from "../auth/index.js";
import { fetchAccountUsage } from "../usage/index.js";
import { clearClientCaches } from "../client/index.js";
import { safeError } from "../utils/index.js";
const agentDir = join(homedir(), ".pi", "agent");
const authPath = join(agentDir, "auth.json");
const accountsPath = join(agentDir, "antigravity-accounts.json");
async function readJson(path, fallback) {
    try {
        return JSON.parse(await readFile(path, "utf8"));
    }
    catch {
        return fallback;
    }
}
async function saveJson(path, value) {
    await mkdir(agentDir, { recursive: true });
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}
function describe(credential) {
    return typeof credential.email === "string" ? credential.email : "Google account";
}
function isSameAccount(a, b) {
    if (!a || !b)
        return false;
    if (a.email && b.email && a.email === b.email)
        return true;
    if (a.access && b.access && a.access === b.access)
        return true;
    if (a.refresh && b.refresh && a.refresh === b.refresh)
        return true;
    return false;
}
/** Pi only refreshes the active account, so every other saved account holds a stale
 * access token that 401s on the quota endpoint. Refresh it on demand. */
async function ensureFreshCredential(credential) {
    if (credential.expires && credential.expires > Date.now())
        return credential;
    try {
        return await refreshAntigravityToken(credential);
    }
    catch (error) {
        throw new Error(`token refresh failed: ${safeError(error)}`);
    }
}
async function switchAccount(name, accounts, ctx) {
    if (!accounts[name]) {
        ctx.ui.notify(`Account not found: ${name}`, "warning");
        return false;
    }
    const auth = await readJson(authPath, {});
    auth.antigravity = accounts[name];
    await saveJson(authPath, auth);
    // Clear client and project ID caches across accounts to prevent cross-account leakage
    clearClientCaches();
    ctx.ui.notify(`✓ Activating account "${name}" (${describe(accounts[name])})...`);
    // Auto-reload Pi session so newly selected credentials take effect immediately
    if (typeof ctx.reload === "function") {
        await ctx.reload();
    }
    else {
        ctx.ui.notify("Run /reload or restart Pi for token changes to take effect.", "info");
    }
    return true;
}
export function registerAccountCommands(pi) {
    pi.registerCommand("antigravity.account", {
        description: "Manage, switch, login, or inspect Antigravity accounts",
        handler: async (args, ctx) => {
            const parts = args.trim().split(/\s+/).filter(Boolean);
            const action = parts[0]?.toLowerCase();
            const name = parts[1];
            const accounts = await readJson(accountsPath, {});
            const auth = await readJson(authPath, {});
            const currentAuth = auth.antigravity;
            // 1. Direct interactive picker if no arguments provided
            if (!action) {
                const entries = Object.entries(accounts);
                if (!entries.length) {
                    ctx.ui.notify("No saved accounts found. Use /antigravity.account login <name> or /antigravity.account save <name>", "warning");
                    return;
                }
                const options = entries.map(([key, value]) => {
                    const active = isSameAccount(currentAuth, value) ? " (active)" : "";
                    return `${key}: ${describe(value)}${active}`;
                });
                const selected = await ctx.ui.select("Select active Antigravity account:", options);
                if (!selected)
                    return;
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
                    ctx.ui.notify("Usage: /antigravity.account login <name>", "warning");
                    return;
                }
                ctx.ui.notify(`Starting Google OAuth authentication for account "${targetName}"...`);
                try {
                    const creds = await loginAntigravity({
                        onAuth: (info) => {
                            ctx.ui.notify(`Open authentication URL in browser:\n${info.url}`);
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
                    ctx.ui.notify(`✓ Successfully logged in and saved account "${targetName}" (${describe(creds)})`);
                    if (typeof ctx.reload === "function") {
                        await ctx.reload();
                    }
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    ctx.ui.notify(`Login failed: ${msg}`, "error");
                }
                return;
            }
            // 3. Save currently active credentials
            if (action === "save" && name) {
                if (!currentAuth) {
                    ctx.ui.notify("Please sign in first with /login antigravity or /antigravity.account login <name>", "warning");
                    return;
                }
                accounts[name] = currentAuth;
                await saveJson(accountsPath, accounts);
                ctx.ui.notify(`✓ Account "${name}" saved (${describe(currentAuth)})`);
                return;
            }
            // 4. List accounts with active indicator
            if (action === "list" || action === "ls") {
                const entries = Object.entries(accounts);
                if (!entries.length) {
                    ctx.ui.notify("No saved accounts found");
                    return;
                }
                const lines = entries.map(([key, value]) => {
                    const isActive = isSameAccount(currentAuth, value);
                    const bullet = isActive ? "● [active]" : "○";
                    return `${bullet} ${key}: ${describe(value)}`;
                });
                ctx.ui.notify(`Saved Antigravity Accounts:\n${lines.join("\n")}`);
                return;
            }
            // 5. Check multi-account usage/quotas simultaneously
            if (action === "usage" || action === "quota") {
                const entries = Object.entries(accounts);
                if (!entries.length) {
                    ctx.ui.notify("No saved accounts to check quota for", "warning");
                    return;
                }
                ctx.ui.notify(`Checking quota for ${entries.length} account(s)...`);
                const results = await Promise.allSettled(entries.map(async ([key, cred]) => {
                    const fresh = await ensureFreshCredential(cred);
                    const refreshed = fresh !== cred;
                    const active = isSameAccount(currentAuth, cred);
                    try {
                        const usage = await fetchAccountUsage(getApiKey(fresh));
                        return { key, cred: fresh, usage, refreshed, active };
                    }
                    catch (error) {
                        return { key, cred: fresh, error: safeError(error), refreshed, active };
                    }
                }));
                let accountsChanged = false;
                let authChanged = false;
                for (const result of results) {
                    if (result.status !== "fulfilled" || !result.value.refreshed)
                        continue;
                    accounts[result.value.key] = result.value.cred;
                    accountsChanged = true;
                    if (result.value.active) {
                        auth.antigravity = result.value.cred;
                        authChanged = true;
                    }
                }
                if (accountsChanged)
                    await saveJson(accountsPath, accounts);
                if (authChanged)
                    await saveJson(authPath, auth);
                const summaryLines = ["=== Multi-Account Quota Status ==="];
                for (const res of results) {
                    if (res.status === "rejected") {
                        const reason = res.reason instanceof Error ? res.reason.message : String(res.reason);
                        summaryLines.push(`\n[!] Failed to retrieve quota: ${reason}`);
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
                    }
                    else {
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
                    ctx.ui.notify("Usage: /antigravity.account rename <old_name> <new_name>", "warning");
                    return;
                }
                if (!accounts[name]) {
                    ctx.ui.notify(`Account not found: ${name}`, "warning");
                    return;
                }
                accounts[newName] = accounts[name];
                delete accounts[name];
                await saveJson(accountsPath, accounts);
                ctx.ui.notify(`✓ Account "${name}" renamed to "${newName}"`);
                return;
            }
            // 8. Delete account
            if ((action === "delete" || action === "remove" || action === "rm") && name) {
                if (!accounts[name]) {
                    ctx.ui.notify(`Account not found: ${name}`, "warning");
                    return;
                }
                delete accounts[name];
                await saveJson(accountsPath, accounts);
                ctx.ui.notify(`✓ Account "${name}" successfully deleted`);
                return;
            }
            // Help message
            ctx.ui.notify("Usage for /antigravity.account:\n" +
                "• (no arguments)            : Open interactive TUI account picker\n" +
                "• login <name>              : Authenticate new Google account and save alias\n" +
                "• use <name>                : Switch active account instantly\n" +
                "• list                      : List all saved accounts and active profile\n" +
                "• usage                     : Check quota status across all accounts\n" +
                "• save <name>               : Save current active login as alias\n" +
                "• rename <old> <new>        : Rename account alias\n" +
                "• delete <name>             : Delete account from storage", "warning");
        },
    });
}
