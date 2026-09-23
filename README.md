# pi-antigravity-multi-account

[![npm version](https://img.shields.io/npm/v/pi-antigravity-multi-account.svg?style=flat-square)](https://www.npmjs.com/package/pi-antigravity-multi-account)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Standalone **Antigravity / Google Cloud Code** provider extension for [Pi coding agent](https://github.com/earendil-works/pi-coding-agent) featuring interactive multi-account switching, simultaneous quota monitoring, automatic session reloading, and intelligent rate-limit retries.

---

## Key Features

- ⚡ **Standalone Native Provider**: Zero external provider or CLI binaries required; native `streamSimple` implementation with low overhead.
- 🧠 **Next-Gen Gemini & Claude Models**: Direct access to `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.1-pro`, `claude-sonnet-4-6`, `claude-opus-4-6`, and `gpt-oss-120b`.
- 👥 **Interactive TUI Account Switcher**: Run `/antigravity.account` with no arguments to pick accounts interactively.
- 🔑 **Single-Step Alias Login**: Authenticate new Google accounts directly into a named alias (`/antigravity.account login <alias>`).
- 📊 **Multi-Account Quota Dashboard**: View remaining quotas and tier status across all accounts simultaneously via `/antigravity.account usage`.
- 🔄 **Zero-Leakage Account Switching**: Switching profiles clears project and model caches, updates credentials, and triggers a live session reload immediately.
- 🛡️ **Jittered Backoff Retry**: Automatic exponential retry with jitter on `429 (Too Many Requests)` and `503 (Service Unavailable)` responses.
- 🧩 **Pi >= 0.86 Full Compatibility**: Seamlessly resolves tools and system instructions from normalized `TranscriptContext` as well as legacy `Context` models.
- ⚡ **Connection Prewarming**: Pre-establishes TLS connections and utilizes persistent keep-alive connection pooling to eliminate cold-start latency.
- 🔒 **Secure Credential Storage**: Multi-account profiles stored in `~/.pi/agent/antigravity-accounts.json` with strict `0o600` file permissions.

---

## Installation

### Via npm (Recommended)

```bash
pi install npm:pi-antigravity-multi-account
```

To update to the latest release:

```bash
pi update npm:pi-antigravity-multi-account
```

### Via Git

```bash
pi install git:andrraa/pi-antigravity
```

To update:

```bash
pi update git:andrraa/pi-antigravity
```

---

## Multi-Account Guide (`/antigravity.account`)

Manage all your accounts effortlessly using the `/antigravity.account` command:

| Subcommand | Syntax | Description |
|---|---|---|
| *(none)* | `/antigravity.account` | Open interactive TUI account picker |
| `login` | `/antigravity.account login <name>` | Authenticate a new Google account via OAuth and assign an alias |
| `use` / `switch` | `/antigravity.account use <name>` | Switch active account and trigger live session reload |
| `list` / `ls` | `/antigravity.account list` | List all saved accounts with active account indicator (`● [active]`) |
| `usage` / `quota` | `/antigravity.account usage` | Check real-time quota status across all saved accounts |
| `save` | `/antigravity.account save <name>` | Save current active session credentials under a new alias |
| `rename` | `/antigravity.account rename <old> <new>` | Rename an existing account alias |
| `delete` / `rm` | `/antigravity.account delete <name>` | Remove an account from storage |

### Quick Examples

```text
# 1. Login with multiple accounts
/antigravity.account login work
/antigravity.account login personal

# 2. Check quota across all accounts at once
/antigravity.account usage

# 3. Switch active account
/antigravity.account use work

# 4. Or switch interactively
/antigravity.account
```

---

## Provider Commands

| Command | Description |
|---|---|
| `/antigravity.account [subcommand]` | Manage multi-account profiles, switch accounts, and monitor multi-account quotas |
| `/antigravity.usage` | Show active account quota pools (Gemini / Claude + GPT, 5h reset & weekly) |
| `/antigravity.models [all]` | List available runtime models and remaining pool fractions |
| `/antigravity.doctor` | Run sanitized connection, project, and model diagnostics |

---

## Supported Models

| Model ID | Thinking Support | Max Output | Description |
|---|---|---|---|
| `antigravity/gemini-3.8-flash` | Off, Minimal, Low, Medium, High, XHigh | 64k tokens | Latest generation fast multimodel agent |
| `antigravity/gemini-3.7-flash` | Off, Minimal, Low, Medium, High, XHigh | 64k tokens | High-performance multimodal reasoning model |
| `antigravity/gemini-3.6-flash` | Low, Medium, High | 64k tokens | Fast agentic Flash model |
| `antigravity/gemini-3.5-flash` | Minimal, Low, Medium, High | 64k tokens | Efficient Flash model |
| `antigravity/gemini-3.1-pro` | Low, High | ~64k tokens | Advanced reasoning model |
| `antigravity/claude-sonnet-4-6` | Thinking (Minimal to XHigh) | 64k tokens | Anthropic Claude Sonnet with reasoning |
| `antigravity/claude-opus-4-6` | Thinking (Minimal to High) | 64k tokens | Anthropic Claude Opus with deep reasoning |
| `antigravity/gpt-oss-120b` | Medium | 32k tokens | Open-source large parameter model |

---

## Configuration & Environment Variables

| Variable | Description | Default |
|---|---|---|
| `ANTIGRAVITY_BASE_URL` | Override the Google Cloud Code endpoint URL | `https://cloudcode-pa.googleapis.com` |
| `ANTIGRAVITY_PROJECT_ID` | Override Google Cloud Project ID explicitly | Auto-discovered or derived from user email |
| `ANTIGRAVITY_NO_PREWARM` | Disable TLS prewarming on extension load (`1` or `true`) | Disabled (prewarming enabled) |
| `ANTIGRAVITY_USER_AGENT` | Custom User-Agent header string | `antigravity/1.15.8 <os>/<arch>` |

---

## Publishing

```bash
# Bumping version
npm version patch # or minor / major

# Publish to npm registry
npm publish --access public
```

---

## Disclaimer & Terms of Use

> **⚠️ Unofficial Project & Limitation of Liability:**
>
> - This project is an **independent, community-maintained, and unofficial extension**. It is **not** affiliated with, endorsed by, sponsored by, or associated with Google LLC, Alphabet Inc., or Anthropic.
> - **Use at your own risk.** You are solely responsible for how you use this extension and for complying with the applicable Terms of Service of Google Cloud, Google Accounts, and any related APIs.
> - The authors and contributors assume **no liability or responsibility** for any account bans, suspensions, restrictions, data loss, quota consumption, billing issues, or any other consequences resulting from the use of this software.

---

## License

[MIT](LICENSE) © andrraa
