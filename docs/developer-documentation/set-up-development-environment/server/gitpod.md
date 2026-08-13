# Server Setup: Gitpod

Gitpod provides an automated, cloud-based development environment for Rocket.Chat that runs directly in your browser or VS Code desktop application.

---

## ⚡ Quick Start

Click the button below or open the URL to launch a pre-configured Gitpod workspace:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/RocketChat/Rocket.Chat)

---

## 🛠️ What is Pre-Configured?

When you launch Rocket.Chat on Gitpod, the `.gitpod.yml` configuration automatically sets up:

- **Node.js**: `v22.22.3`
- **Yarn**: `v4.12.0`
- **MongoDB**: Automatically started container instance (`v8.0`)
- **Meteor**: `v3.4.1`
- **Dependencies**: Auto-run `yarn` installation
- **Port Forwarding**: Port `3000` is automatically exposed with a public preview link.

---

## 🚀 Running the App in Gitpod

Once the Gitpod workspace completes initialization, run:

```bash
yarn dev
```

Gitpod will prompt you with an option to open port `3000` in a browser window or side preview.

---

## 🔗 Related Setup Paths

- [Server Setup Index](index.md)
- [🍏 Mac OSX Setup Guide](mac-osx.md)
- [🐧 Linux Setup Guide](linux.md)
- [🪟 Windows (WSL) Setup Guide](windows.md)
