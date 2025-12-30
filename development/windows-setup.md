# Rocket.Chat Local Development Setup (Windows)

This guide describes the **verified and recommended way to run Rocket.Chat locally on Windows** for development and community contribution.

---

##  Supported Platforms

- Windows 10
- Windows 11

Tested using:
- Native Windows environment
- Docker Desktop for MongoDB only

---

##  Choosing the Correct Setup 

Rocket.Chat supports **different tooling for different purposes**.

###  Supported for Contributors

- **Meteor-based local development**
- MongoDB (local install or Docker)
- Native Node.js tooling

###  Not recommended for Contributors
- Docker Compose–based local development
- CI or deployment Docker workflows

---

##  Docker vs Meteor (which one you should use?)

| Use case                  | Recommended tool |
|---------------------------|------------------|
| Local development         | Meteor + MongoDB |
| Hot reload & debugging    | Meteor           |
| Contributing code         | Meteor           |
| CI pipelines              | Docker Compose   |
| Production deployment     | Docker Compose   |
| Enterprise microservices  | Docker Compose   |

---

### Why this matters

The Rocket.Chat codebase **relies on Meteor’s runtime, bundling, and hot reload** during development.  
Docker Compose files exist to support **CI and deployment scenarios**, not developer workflows.

---

##  About Docker Compose Files in This Repository

Files such as:

- `docker-compose-ci.yml`
- `docker-compose-local.yml`

are **not intended for contributor local setup**.

They:
- Depend on CI-only environment variables (`DOCKER_TAG`, `LOWERCASE_REPOSITORY`, `TRANSPORTER`)
- Reference enterprise-only services
- Assume prebuilt images from CI pipelines

Running these locally often results in:
- `no configuration file provided`
- invalid Docker image references
- missing environment variable errors

This behavior is expected and does **not** indicate a broken setup.

---


##  Prerequisites

Install the following tools before starting.

### 1. Node.js (Required)

- Recommended: **Node.js 20.x (LTS)**

Download from: https://nodejs.org

#### Verify:

```bash
node -v
npm -v
```

### 2. Meteor (Required)
Rocket.Chat is built on Meteor and must be run using it.

#### Install globally:

```bash
npm install -g meteor
```

#### Verify:
```bash
meteor --version
```

### 3. Git (Required)

Ensure Git is installed and configured correctly for Windows:

```bash
git config --global core.autocrlf false
```
This avoids line-ending issues during builds.


### 4. Docker Desktop (Recommended)

- Docker is only required for MongoDB.
- Install Docker Desktop for Windows
- Enable WSL 2
- Ensure Docker is running

#### Verify:

```bash
docker --version
```
---

## Clone the Repository

```bash
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
```
---

## MongoDB Setup (Using Docker)

Rocket.Chat requires MongoDB with a replica set.

### Start MongoDB:

```bash
  docker run -d ^
  --name rocketchat-mongo ^
  -p 27017:27017 ^
  mongo:6 ^
  --replSet rs0
  ```

#### Initialize the replica set:

```bash
docker exec -it rocketchat-mongo mongosh --eval "rs.initiate()"
```

## Environment Configuration

Create a .env file in the root of the repository:

MONGO_URL=mongodb://localhost:27017/rocketchat?replicaSet=rs0
MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs0
ROOT_URL=http://localhost:3000
PORT=3000

---

## Install Dependencies

From the repository root:

```bash
meteor npm install
```
---

## ▶️ Start Rocket.Chat

```bash
meteor npm start
```

First startup may take several minutes.

---

##  Access the Application

Open your browser and visit:
http://localhost:3000
You should see the Rocket.Chat setup screen.

---

## How to Confirm Everything Works?

- No fatal errors in the terminal
- MongoDB replica set initialized successfully
- Web UI loads on localhost:3000
- Admin account creation works

### Docker Compose Clarification

The following files are NOT meant for local contributor development:

- docker-compose-ci.yml
- docker-compose-local.yml

They:
- Depend on CI-only variables (DOCKER_TAG, LOWERCASE_REPOSITORY)
- Reference enterprise microservices
- Are intended for CI and deployment pipelines

Attempting to run them locally may result in errors such as:
- no configuration file provided
- invalid Docker image references
- missing environment variables

This behavior is expected.

---

## Troubleshooting (Windows)

### MongoDB connection errors

- Ensure Docker Desktop is running
- Ensure replica set is initialized
- Restart the MongoDB container if needed

### Build failures during meteor npm install

- Ensure Node.js version is supported
- Restart terminal after installing Meteor
- Delete node_modules and retry

### Port 3000 already in use

- Stop the process using the port
- Or change PORT in .env

### Line ending issues

Ensure:
```bash
git config --global core.autocrlf false
```
---

## Contributing Notes

- This guide focuses on community contributor workflows
- Enterprise and deployment setups are intentionally excluded
- If you encounter Windows-specific issues not listed here, please open an issue




