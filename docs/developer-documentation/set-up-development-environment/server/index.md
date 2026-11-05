# Server Environment Setup

Welcome to the Rocket.Chat server development environment setup guide. Choose your operating system or preferred setup environment below to get started.

All options provide a complete development environment for building, running, and contributing to Rocket.Chat.

---

## 🛠️ Choose Your Development Environment

All setup paths carry equal support and weight. Select the environment that matches your workflow:

| Environment | Description | Setup Guide |
| :--- | :--- | :--- |
| ☁️ **Gitpod** | Instant, zero-config cloud development environment running directly in your browser or VS Code desktop. | [Gitpod Setup Guide](gitpod.md) |
| 🍏 **Mac OSX** | Native local development environment for macOS using Homebrew and Xcode Command Line Tools. | [Mac OSX Setup Guide](mac-osx.md) |
| 🐧 **Linux** | Native local development environment for Linux distributions (Ubuntu, Debian, RHEL). | [Linux Setup Guide](linux.md) |
| 🪟 **Windows (WSL)** | Unix-based development environment on Windows using Windows Subsystem for Linux 2 (WSL2). | [Windows Setup Guide](windows.md) |

---

## 📋 Common Shared Prerequisites

Regardless of which local platform you choose (**Mac OSX**, **Linux**, or **Windows WSL**), Rocket.Chat requires the following core software stack:

- **Node.js**: `v22.22.3` (Managed via `nvm` or `fnm`)
- **Package Manager**: `Yarn v4.18.0` (Corepack enabled)
- **Framework**: `Meteor v3.4.1`
- **Database**: `MongoDB v8.0`
- **Version Control**: `Git`

---

## 🚀 Quick Navigation

- [☁️ Gitpod Setup Path](gitpod.md)
- [🍏 Mac OSX Setup Path](mac-osx.md)
- [🐧 Linux Setup Path](linux.md)
- [🪟 Windows (WSL) Setup Path](windows.md)
