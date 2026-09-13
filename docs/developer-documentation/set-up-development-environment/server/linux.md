# Server Setup: Linux

This guide walks you through setting up a native local development environment for the Rocket.Chat server on Linux distributions (Ubuntu, Debian, RHEL).

---

## 📋 Shared Prerequisites

Like all local setup paths, Rocket.Chat requires the following core stack on Linux:

- **Node.js**: `v22.22.3` (Managed via `nvm` or `fnm`)
- **Yarn**: `v4.18.0` (Corepack enabled)
- **MongoDB**: `v8.0`
- **Meteor**: `v3.4.1` (Rocket.Chat build framework)
- **Build Tools**: `gcc`, `g++`, `make` (`build-essential` or `Development Tools`)
- **Git**: Version control

---

## 🛠️ Step-by-Step Installation

### 1. Install Build Tools & System Packages

#### Debian / Ubuntu (`apt`):

```bash
sudo apt update
sudo apt install -y build-essential curl git gnupg
```

#### RHEL / AlmaLinux / Rocky Linux (`dnf`):

```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y curl git
```

---

### 2. Install Node.js & Yarn

Use `nvm` (Node Version Manager) to install the project-specified Node.js version:

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

#### Debian / Ubuntu (`apt`):

1. Create the keyrings directory and import the MongoDB GPG key:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /etc/apt/keyrings/mongodb-server-8.0.gpg
```

2. Add the MongoDB 8.0 repository for your specific distribution:

**Ubuntu 22.04 LTS (Jammy):**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

**Ubuntu 24.04 LTS (Noble):**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

**Debian 12 (Bookworm):**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

3. Update package index and install MongoDB:

```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### RHEL-compatible distributions (`dnf`):

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-8.0.repo
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/8.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-8.0.asc
EOF
sudo dnf install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
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

The Rocket.Chat server will start and be available at `http://localhost:3000`.

---

## 🔗 Related Setup Paths

- [Server Setup Index](index.md)
- [☁️ Gitpod Setup Guide](gitpod.md)
- [🍏 Mac OSX Setup Guide](mac-osx.md)
- [🪟 Windows (WSL) Setup Guide](windows.md)
