<h1 align="center">pi-antigravity-multi-account</h1>

<p align="center">
  <em>Standalone Antigravity and Google Cloud Code provider extension for Pi Coding Agent with interactive multi-account switching and simultaneous quota monitoring.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/pi-antigravity-multi-account"><img src="https://img.shields.io/npm/v/pi-antigravity-multi-account.svg?style=flat-square" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/Pi-Coding%20Agent-0969da?style=flat-square" alt="Pi Coding Agent" />
  <img src="https://img.shields.io/badge/Node-%3E%3D18.0.0-2ea44f?style=flat-square" alt="Node Version" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-bf8700?style=flat-square" alt="License: MIT" /></a>
</p>

<p align="center">
  <img src="assets/banner.svg" alt="pi-antigravity banner" width="850" />
</p>

---

## Overview

**pi-antigravity-multi-account** is a native provider extension for the [Pi Coding Agent](https://pi.dev) that enables direct access to Google Cloud Code and Antigravity models (Gemini Flash, Claude 3.7/Sonnet, Opus, and GPT-OSS).

It features native OAuth authentication, seamless switching across multiple Google accounts, real-time quota pool monitoring, and automatic token refresh without requiring external CLI dependencies.

### Features
- **Standalone Native Provider:** Direct `streamSimple` implementation with zero external binaries or CLI dependencies.
- **Interactive Account Switcher:** Select and switch accounts dynamically via a terminal picker (`/antigravity.account`).
- **Single-Step Alias Authentication:** Link multiple Google accounts under custom named aliases (`/antigravity.account login <alias>`).
- **Simultaneous Quota Dashboard:** Inspect remaining hourly and weekly quota pools across all stored accounts simultaneously.
- **Zero-Downtime Session Reloading:** Switching accounts purges model/project caches and invokes live session reloading immediately.
- **Resilient Request Handling:** Exponential backoff retry with jitter on `429 (Too Many Requests)` and `503 (Service Unavailable)`.
- **Connection Prewarming:** Pre-establishes TLS handshakes with persistent keep-alive pools to eliminate cold-start latency.
- **Secure Local Storage:** Credentials are saved to `~/.pi/agent/antigravity-accounts.json` with strict POSIX `0o600` permissions.

---

## Installation

### Via npm (Recommended)

```bash
pi install npm:pi-antigravity-multi-account
```

To upgrade:

```bash
pi update npm:pi-antigravity-multi-account
```

### Via Git

```bash
pi install git:andrraa/pi-antigravity
```

To upgrade:

```bash
pi update git:andrraa/pi-antigravity
```

---

## Multi-Account Guide

Manage accounts and quotas using the `/antigravity.account` command:

| Subcommand | Syntax | Description |
|:---|:---|:---|
| *(none)* | `/antigravity.account` | Open interactive terminal account picker |
| `login` | `/antigravity.account login <alias>` | Authenticate a new Google account via OAuth and assign an alias |
| `use` / `switch` | `/antigravity.account use <alias>` | Switch active account and trigger live session reload |
| `list` / `ls` | `/antigravity.account list` | List all saved accounts with active account indicator (`● [active]`) |
| `usage` / `quota` | `/antigravity.account usage` | Check real-time quota status across all saved accounts |
| `save` | `/antigravity.account save <alias>` | Save current active session credentials under a new alias |
| `rename` | `/antigravity.account rename <old> <new>` | Rename an existing account alias |
| `delete` / `rm` | `/antigravity.account delete <alias>` | Remove an account from storage |

### Common Workflows

```text
# 1. Authenticate multiple Google accounts
/antigravity.account login work
/antigravity.account login personal

# 2. Check quota pools across all accounts
/antigravity.account usage

# 3. Switch active account
/antigravity.account use work

# 4. Open interactive account picker
/antigravity.account
```

---

## Provider Commands

| Command | Description |
|:---|:---|
| `/antigravity.account [subcommand]` | Manage multi-account profiles, switch accounts, and monitor quotas |
| `/antigravity.usage` | Show active account quota pools (Gemini / Claude + GPT, 5h reset & weekly) |
| `/antigravity.models [all]` | List available runtime models and remaining pool fractions |
| `/antigravity.doctor` | Run sanitized connection, project, and model diagnostics |

---

<details>
<summary><strong>Supported Models</strong></summary>

| Model ID | Thinking Support | Max Output | Description |
|:---|:---|:---|:---|
| `antigravity/gemini-3.8-flash` | Off, Minimal, Low, Medium, High, XHigh | 64k tokens | Latest generation multimodal agent model |
| `antigravity/gemini-3.7-flash` | Off, Minimal, Low, Medium, High, XHigh | 64k tokens | High-performance multimodal reasoning model |
| `antigravity/gemini-3.6-flash` | Low, Medium, High | 64k tokens | Fast agentic Flash model |
| `antigravity/gemini-3.5-flash` | Minimal, Low, Medium, High | 64k tokens | Efficient Flash model |
| `antigravity/gemini-3.1-pro` | Low, High | ~64k tokens | Advanced reasoning model |
| `antigravity/claude-sonnet-4-6` | Thinking (Minimal to XHigh) | 64k tokens | Anthropic Claude Sonnet with extended reasoning |
| `antigravity/claude-opus-4-6` | Thinking (Minimal to High) | 64k tokens | Anthropic Claude Opus with deep reasoning |
| `antigravity/gpt-oss-120b` | Medium | 32k tokens | Open-source large parameter model |
</details>

<details>
<summary><strong>Configuration & Environment Variables</strong></summary>

| Variable | Description | Default |
|:---|:---|:---|
| `ANTIGRAVITY_BASE_URL` | Override the Google Cloud Code endpoint URL | `https://cloudcode-pa.googleapis.com` |
| `ANTIGRAVITY_PROJECT_ID` | Override Google Cloud Project ID explicitly | Auto-discovered or derived from user email |
| `ANTIGRAVITY_NO_PREWARM` | Disable TLS prewarming on extension load (`1` or `true`) | Disabled (prewarming enabled) |
| `ANTIGRAVITY_USER_AGENT` | Custom User-Agent header string | Standard Google Cloud Code client user agent |
</details>

<details>
<summary><strong>Publishing & Releases</strong></summary>

```bash
# Bump version
npm version patch # or minor / major

# Publish to npm registry
npm publish --access public
```
</details>

<details>
<summary><strong>Disclaimer & Terms of Use</strong></summary>

- This project is an **independent, community-maintained, and unofficial extension**. It is **not** affiliated with, endorsed by, sponsored by, or associated with Google LLC, Alphabet Inc., or Anthropic.
- **Use at your own risk.** Users are solely responsible for compliance with the Terms of Service of Google Cloud, Google Accounts, and applicable third-party API agreements.
- The authors assume **no liability or responsibility** for account restrictions, suspensions, data loss, quota depletion, or billing impact resulting from the use of this software.
</details>

---

## License

This project is licensed under the [MIT License](LICENSE).
