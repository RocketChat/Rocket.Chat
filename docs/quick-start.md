# Quick Start for Contributors

This guide provides a consolidated setup flow for running Rocket.Chat locally for development. It includes setup requirements, verification steps, and troubleshooting notes based on common contributor onboarding issues.

## Prerequisites

Before starting, ensure the required development tools are installed.

### Required Versions

Verify the currently supported versions from:

* `package.json`
* `.yarnrc.yml`
* `apps/meteor/.meteor/release`

### Additional Requirements

* Python 3.x
* Visual Studio Build Tools (Windows users)

  * Desktop development with C++ workload

## 1. Clone the Repository

```bash
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
```

## 2. Install Dependencies

```bash
yarn install
```

This installs all workspace dependencies required by the monorepo.

## 3. Build the Repository

Rocket.Chat uses Turbo to manage builds across packages.

```bash
yarn build
```

## 4. Start the Development Environment

```bash
yarn dev
```

The initial startup may take several minutes depending on your system configuration.

## 5. Verify Your Setup

A successful setup should meet the following criteria:

* `yarn install` completes successfully.
* `yarn build` completes successfully.
* `yarn dev` starts without critical startup errors.
* Opening `http://localhost:3000` displays the Rocket.Chat workspace setup screen or login page.

If all of the above succeed, your local development environment is ready.

## Windows Troubleshooting

Several contributors have reported additional setup challenges when developing on Windows.

### Path Length and Spaces

Some build processes may fail when the repository is located in deeply nested directories or paths containing spaces.

Prefer a short path such as:

```text
C:\RocketChat
```

instead of deeply nested directories containing spaces.

### Terminal Compatibility

Some scripts rely on POSIX-style utilities.

If you encounter script-related errors while using Command Prompt or PowerShell, try running the commands from Git Bash.

### Native Module Compilation Errors

Errors involving packages such as:

* `@swc/core`
* `argon2`
* `node-gyp-build`

are often related to native compilation requirements.

Verify that:

* Visual Studio Build Tools are installed.
* Python is available in PATH.
* Node.js matches the repository requirements.

Then rerun:

```bash
yarn install
```

### Memory-Related Build Failures

Some contributors have reported failures during dependency linking or build steps on systems with limited RAM.

You can increase Node.js memory allocation before running build commands.

PowerShell:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

## Common Troubleshooting Checklist

Before opening a support request, verify:

* Node.js version matches project requirements.
* Yarn version matches project requirements.
* Meteor version matches project requirements.
* Visual Studio Build Tools are installed (Windows).
* Python is available in PATH.
* The repository path does not contain spaces.
* `yarn install` completed successfully.
* `yarn build` completed successfully.

## Getting Help

If you are still unable to complete the setup:

1. Review the official documentation and contribution guides.
2. Search existing GitHub issues for similar errors.
3. When requesting help, include:

   * Operating system
   * Node.js version
   * Yarn version
   * Meteor version
   * Full error output
   * Steps already attempted

Providing this information helps maintainers and contributors diagnose issues more efficiently.
