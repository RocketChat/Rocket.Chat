# Server Setup: Gitpod

Gitpod provides an automated, cloud-based development environment for Rocket.Chat that runs directly in your browser or VS Code desktop application.

---

## ⚡ Quick Start

Click the button below or open the URL to launch a pre-configured Gitpod workspace:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/RocketChat/Rocket.Chat)

---

## 🛠️ What is Pre-Configured?

When you launch Rocket.Chat on Gitpod, the `.gitpod/.gitpod.yml` configuration automatically sets up:

- **Node.js**: `v22.22.3`
- **Yarn**: `v4.18.0`
- **Meteor**: `v3.4.1` (with embedded development database)
- **Dependencies**: Auto-run `yarn` installation during initialization
- **Automatic Server Startup**: Automatically executes `yarn dsv` upon workspace start
- **Port Forwarding**: Port `3000` is automatically exposed and opened in a side preview pane (`open-preview`)

---

## 🚀 Running the App in Gitpod

Once the Gitpod workspace completes initialization, the development server will launch automatically via `yarn dsv` and open a preview window on port `3000`.

If you ever need to manually restart the development server, run:

```bash
yarn dsv
```

*(You can also run `yarn dev` if you prefer the standard dev task).*

---

## 🔗 Related Setup Paths

- [Server Setup Index](index.md)
- [🍏 Mac OSX Setup Guide](mac-osx.md)
- [🐧 Linux Setup Guide](linux.md)
- [🪟 Windows (WSL) Setup Guide](windows.md)
