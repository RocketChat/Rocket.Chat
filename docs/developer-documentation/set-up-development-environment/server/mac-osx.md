# Server Setup: Mac OSX

This guide walks you through setting up a native local development environment for the Rocket.Chat server on macOS.

---

## 📋 Prerequisites

Before setting up Rocket.Chat on macOS, ensure you have installed:

- **macOS**: macOS 14 Sonoma or newer
- **Xcode Command Line Tools**: `xcode-select --install`
- **Homebrew**: Package manager for macOS
- **Node.js**: `v22.22.3` (Recommended to install via `nvm` or `fnm`)
- **Yarn**: `v4.18.0` (via Corepack)
- **MongoDB**: `v8.0`
- **Meteor**: `v3.4.1` (Rocket.Chat build framework)

---

## 🛠️ Step-by-Step Installation

### 1. Install System Dependencies

Open your terminal and install Xcode CLI tools and Homebrew:

```bash
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
```

---

### 2. Install Node.js & Yarn

Use `nvm` to manage Node.js versions:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22.22.3
nvm use 22.22.3
corepack enable
```

> [!NOTE]
> `nvm` requires a POSIX-compliant shell (such as `bash` or `zsh`). If you use **Fish shell**, `nvm` is not supported; use [`fnm`](https://github.com/Schniz/fnm) (Fast Node Manager) instead (`fnm install 22.22.3 && fnm use 22.22.3`).

---

### 3. Install & Start MongoDB 8.0

Install and start MongoDB community edition via Homebrew:

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```

---

### 4. Clone Rocket.Chat Repository

```bash
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
```

---

### 5. Install Project Dependencies

```bash
yarn
```

---

### 6. Install & Verify Meteor CLI

Install the pinned version of Meteor CLI specified by `apps/meteor/.meteor/release`:

```bash
npm install -g meteor@3.4.1
meteor --version
```

---

### 7. Start Development Server

```bash
yarn dev
```

The Rocket.Chat development server will start and be available at `http://localhost:3000`.

---

## 🔗 Related Setup Paths

- [Server Setup Index](index.md)
- [☁️ Gitpod Setup Guide](gitpod.md)
- [🐧 Linux Setup Guide](linux.md)
- [🪟 Windows (WSL) Setup Guide](windows.md)
