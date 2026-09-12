# pi-antigravity-multi-account

[![npm version](https://img.shields.io/npm/v/pi-antigravity-multi-account.svg?style=flat-square)](https://www.npmjs.com/package/pi-antigravity-multi-account)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Standalone **Antigravity / Google Cloud Code** provider extension for [Pi coding agent](https://github.com/earendil-works/pi-coding-agent) featuring interactive multi-account switching and quota monitoring.

---

## Features

- ⚡ **Standalone Antigravity Provider**: Zero external provider dependencies, fully self-contained.
- 🤖 **Next-Gen Gemini & Claude Models**:
  - `gemini-3.8-flash`
  - `gemini-3.7-flash`
  - `gemini-3.6-flash`
  - `gemini-3.5-flash`
  - `gemini-3.1-pro`
  - `claude-sonnet-4-6` (Thinking)
  - `claude-opus-4-6` (Thinking)
  - `gpt-oss-120b`
- 🖥️ **Interactive TUI Account Picker**: Simply type `/antigravity.account` to select and switch accounts from an interactive menu.
- 🔑 **Direct Login to Alias**: Authenticate new accounts and name them in a single step via `/antigravity.account login <alias>`.
- 📊 **Multi-Account Quota Dashboard**: View remaining quotas across all saved accounts simultaneously with `/antigravity.account usage`.
- 🔄 **Automatic Live Switching**: Switching an account triggers a live session reload automatically.
- 🔒 **Secure Storage**: Credentials stored in `~/.pi/agent/antigravity-accounts.json` with strict `0600` file permissions.

---

## Installation

### Via npm (recommended)

```bash
pi install npm:pi-antigravity-multi-account
```

To update:

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

## Usage Guide

All multi-account features are accessible via `/antigravity.account`:

### 1. Interactive Account Picker (TUI)
Just run the command with no arguments to pick an account interactively:
```text
/antigravity.account
```

### 2. Login Directly to an Alias
Authenticate and save a new profile in one go:
```text
/antigravity.account login work
/antigravity.account login personal
```

### 3. List All Saved Accounts
View saved profiles with active session indicators:
```text
/antigravity.account list
```

**Output example:**
```text
● [active] work: dev@company.com
○ personal: user@gmail.com
```

### 4. Switch Accounts
Quickly switch the active profile:
```text
/antigravity.account use work
```

### 5. Multi-Account Quota Dashboard
Check quota and rate limits across **all** your accounts at once:
```text
/antigravity.account usage
```

### 6. Rename or Delete Accounts
```text
# Rename alias
/antigravity.account rename work office

# Delete account
/antigravity.account delete personal
```

---

## Provider Commands

| Command | Description |
|---|---|
| `/antigravity.account` | Open interactive account switcher or manage accounts |
| `/antigravity.usage` | Show active account quota pools (Gemini / Claude+GPT) |
| `/antigravity.models [all]` | List runtime models + remaining quota fraction |
| `/antigravity.doctor` | Run sanitized connection and model diagnostics |

---

## Publishing to npm

```bash
# Bumping version
npm version patch # or minor / major

# Publish to npm registry
npm publish --access public
```

---

## License

[MIT](LICENSE) © andrraa
