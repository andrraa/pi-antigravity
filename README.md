# pi-antigravity-multi-account

[![npm version](https://img.shields.io/npm/v/pi-antigravity-multi-account.svg?style=flat-square)](https://www.npmjs.com/package/pi-antigravity-multi-account)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Standalone **Antigravity / Google Cloud Code** provider extension for [Pi coding agent](https://github.com/earendil-works/pi-coding-agent) with built-in multi-account management.

---

## Features

- ⚡ **Full Standalone Antigravity Provider**: Direct native integration without external extension dependencies.
- 🤖 **Next-Gen Gemini & Claude Support**:
  - `gemini-3.8-flash`
  - `gemini-3.7-flash`
  - `gemini-3.6-flash`
  - `gemini-3.5-flash`
  - `gemini-3.1-pro`
  - `claude-sonnet-4-6` (Thinking)
  - `claude-opus-4-6` (Thinking)
  - `gpt-oss-120b`
- 💾 **Save & Switch Accounts**: Store multiple authenticated sessions locally with custom aliases.
- ✏️ **Rename & Manage**: Reorganize or delete saved accounts on demand.
- 📊 **Quota & Model Diagnostics**: Check remaining quota pools with `/antigravity.usage` and models via `/antigravity.models`.
- 🔒 **Secure Storage**: Account tokens stored with strict `0600` file permissions.

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

### 1. Authentication & Multi-Account Management

All account management commands are run using `/antigravity.account`:

#### Login and Save First Account
```text
/login antigravity
/antigravity.account save work
```

#### Login and Save Second Account
```text
/login antigravity
/antigravity.account save personal
```

#### List Saved Accounts
```text
/antigravity.account list
```

#### Switch Between Accounts
```text
/antigravity.account use work
```
> **Note:** Run `/reload` or restart your session after switching accounts.

#### Rename an Account Alias
```text
/antigravity.account rename work office
```

#### Delete an Account
```text
/antigravity.account delete personal
```
*(Aliases: `remove`, `rm`)*

---

### 2. Antigravity Diagnostics & Quota

| Command | Description |
|---|---|
| `/antigravity.usage` | Show shared quota pools (Gemini / Claude+GPT, 5h + weekly) |
| `/antigravity.models [all]` | List active runtime models + remaining quota fraction |
| `/antigravity.doctor` | Run sanitized connection and model diagnostics |

---

## Command Summary

| Action | Command Syntax | Description |
|---|---|---|
| **Save** | `/antigravity.account save <name>` | Save current login as `<name>` |
| **List** | `/antigravity.account list` | List all saved accounts |
| **Use** | `/antigravity.account use <name>` | Switch active account to `<name>` |
| **Rename** | `/antigravity.account rename <old> <new>` | Rename account alias |
| **Delete** | `/antigravity.account delete <name>` | Remove account from storage (`remove`/`rm`) |

---

## Publishing to npm

```bash
# Bumping version
npm version patch # or minor / major

# Publish
npm publish --access public
```

---

## License

[MIT](LICENSE) © andrraa
