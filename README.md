# pi-antigravity-multi-account

Multi-account management extension for [pi-antigravity](https://github.com/andrraa/pi-antigravity). Seamlessly save, switch, rename, and manage multiple Antigravity (Google) accounts within [Pi coding agent](https://github.com/earendil-works/pi-coding-agent).

---

## Features

- 💾 **Save Accounts**: Store multiple authenticated sessions locally with custom aliases.
- 🔄 **Quick Switching**: Switch between personal, work, or secondary accounts on the fly.
- ✏️ **Rename Aliases**: Easily reorganize saved account names.
- 🗑️ **Delete Accounts**: Remove obsolete credentials from the store.
- 🔒 **Secure Storage**: Account tokens are saved with restricted file permissions (`0600`).

---

## Installation

Install directly into Pi via Git:

```bash
pi install git:andrraa/pi-antigravity
```

To update to the latest version:

```bash
pi update git:andrraa/pi-antigravity
```

---

## Usage Guide

All commands are run using the `/antigravity.account` slash command in Pi.

### 1. Saving Accounts

Authenticate your account first, then assign it an alias:

```text
/login antigravity
/antigravity.account save work
```

To add another account, repeat the login with your second Google account:

```text
/login antigravity
/antigravity.account save personal
```

### 2. Listing Saved Accounts

View all stored accounts and their associated emails:

```text
/antigravity.account list
```

**Output example:**
```text
work: dev@company.com
personal: user@gmail.com
```

### 3. Switching Accounts

Activate a specific saved account:

```text
/antigravity.account use work
```

> **Note:** Run `/reload` or restart Pi session for the active token to take effect.

### 4. Renaming an Account Alias

Rename an existing saved profile:

```text
/antigravity.account rename <old_name> <new_name>
```

**Example:**
```text
/antigravity.account rename work office
```

### 5. Deleting an Account

Remove an account from storage:

```text
/antigravity.account delete <name>
```

*(Aliases: `remove`, `rm`)*

**Example:**
```text
/antigravity.account rm personal
```

---

## Command Summary

| Action | Command Syntax | Description |
|---|---|---|
| **Save** | `/antigravity.account save <name>` | Save currently active login as `<name>` |
| **List** | `/antigravity.account list` | List all saved accounts |
| **Use** | `/antigravity.account use <name>` | Switch active session to `<name>` |
| **Rename** | `/antigravity.account rename <old> <new>` | Rename account alias |
| **Delete** | `/antigravity.account delete <name>` | Delete account from storage (or `remove`/`rm`) |

---

## License

MIT
