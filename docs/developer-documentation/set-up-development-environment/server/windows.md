# Server Setup: Windows (WSL2)

Because Rocket.Chat's server development workflow relies heavily on Unix build tools and POSIX-compliant environments, developing Rocket.Chat on Windows is officially supported using **Windows Subsystem for Linux 2 (WSL2)** running an Ubuntu distribution.

---

## 📋 Shared Prerequisites

Inside your WSL2 environment, Rocket.Chat requires the standard stack:

- **Windows**: Windows 10 (Build 19041+) or Windows 11
- **WSL2**: Windows Subsystem for Linux version 2 (Ubuntu 22.04 LTS or 24.04 LTS)
- **Node.js**: `v22.22.3` (inside WSL via `nvm`)
- **Yarn**: `v4.18.0` (Corepack enabled inside WSL)
- **MongoDB**: `v8.0` (inside WSL or via Docker for Windows)
- **Meteor**: `v3.4.1` (Rocket.Chat build framework)

---

## 🛠️ Step-by-Step Installation

### 1. Enable WSL2 and Install Ubuntu

Open PowerShell as Administrator on Windows and run:

```powershell
wsl --install -d Ubuntu
```

Restart your computer if prompted. After restarting, launch the **Ubuntu** app from your Windows Start Menu to set up your UNIX username and password.

#### Verify WSL Version

Check the WSL version of your installed distribution:

```powershell
wsl --list --verbose
```

If the installed distribution displays `1` under the `VERSION` column, upgrade it to WSL2:

```powershell
wsl --set-version <DistributionName> 2
```

*(Substitute `<DistributionName>` with your actual distro name shown in `wsl --list --verbose`, e.g., `Ubuntu-22.04` or `Ubuntu`).*

To ensure all future Linux distribution installs default to WSL2, run:

```powershell
wsl --set-default-version 2
```

---

### 2. Configure Ubuntu WSL Environment

Open your Ubuntu WSL terminal shell and install basic build tools and dependencies:

```bash
sudo apt update && sudo apt install -y build-essential curl git gnupg
```

---

### 3. Install Node.js & Yarn inside WSL

In the WSL terminal:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22.22.3
nvm use 22.22.3
corepack enable
```

---

### 4. Install & Start MongoDB 8.0 in WSL

1. Create the keyrings directory and import the MongoDB GPG key:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /etc/apt/keyrings/mongodb-server-8.0.gpg
```

2. Add the MongoDB 8.0 repository line for your Ubuntu release:

**Ubuntu 22.04 LTS (Jammy):**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

**Ubuntu 24.04 LTS (Noble):**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

3. Update package index, install MongoDB, and start the service:

```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod start
```

> [!NOTE]
> If systemd is enabled in your WSL2 configuration (`/etc/wsl.conf`), you can run `sudo systemctl start mongod` and `sudo systemctl enable mongod` instead.

---

### 5. Clone Repository inside WSL Filesystem

> [!IMPORTANT]
> Clone the project into the Linux filesystem (e.g., `/home/username/code/Rocket.Chat`) rather than the Windows filesystem (`/mnt/c/...`). Accessing `/mnt/c/` from WSL causes significant disk I/O performance degradation during `yarn` operations.

```bash
mkdir -p ~/code
cd ~/code
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
```

---

### 6. Install Dependencies & Verify Meteor CLI

```bash
yarn
npm install -g meteor@3.4.1
meteor --version
```

---

### 7. Start Development Server

```bash
yarn dev
```

Access the server from your Windows web browser at `http://localhost:3000`.

---

## 🔗 Related Setup Paths

- [Server Setup Index](index.md)
- [☁️ Gitpod Setup Guide](gitpod.md)
- [🍏 Mac OSX Setup Guide](mac-osx.md)
- [🐧 Linux Setup Guide](linux.md)
