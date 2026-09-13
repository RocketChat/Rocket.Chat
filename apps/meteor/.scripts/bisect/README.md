# Git Bisect Test Runner

A shell script wrapper for automating git bisect operations with end-to-end (e2e) tests in the Rocket.Chat project.

## Overview

This script automates the process of finding problematic commits using git bisect and playwright tests by:
- Setting up the correct Node.js version
- Installing dependencies
- Starting the development server
- Running Playwright e2e tests
- Returning appropriate exit codes for git bisect

## Prerequisites

Before using this script, ensure you have the following installed:

- **Node.js** (version will be automatically managed)
- **nvm** (Node Version Manager)
- **yarn** (package manager)
- **git** (for bisect operations)

## Usage

### Basic Usage

1. **Start from the repository root directory**
2. **Initialize git bisect**:
   ```bash
   git bisect start
   git bisect bad <bad-commit>    # Known problematic commit
   git bisect good <good-commit>  # Known working commit
   ```

3. **Run the bisect with this script**:
   ```bash
   git bisect run ./apps/meteor/.scripts/bisect/bisect-test.sh
   ```

### Tips
- After setting up the good and bad commits, run `git bisect log > gb_log.txt`. This will save a log file with the steps git-bisect took so far. If you want to run the bisect from the beggining, you can then just run `git bisect reset && git bisect replay gb_log.txt` and git-bisect will return to that step.
- You can create as many bisect logs as you want in any step you might want to return. You can also save it after bisect finishes in order to get a full log of the tested commits and their results.
- Use as few fixtures and page objects as possible. They can change between commits and give false-positives.
- Make your locators bullet-proof. Try to use semantic locators (such as page.getByRole) and avoid direct dom tree inferences. Content dispostion, styles and text might change between commits and cause false positives in the test.
- Although this is not suported currently, you can use other mechanisms to test the commits, such as unit tests or custom scripts. Feel free to experiment and create additional scripts or add options/env vars to the current script to support different tests/assertions about the current commit.

## Caveats

### Important: Script Self-Copy Behavior

⚠️ **The script will automatically copy itself to the repository root** on first run to prevent it from disappearing when git bisect changes commits. All paths in the script assume it is being ran from root.

When you first run the script from `apps/meteor/.scripts/bisect/`, it will:
1. Copy itself to `./bisect-test.sh` in the repository root
2. Exit with instructions to run from the root directory
3. You should then run: `git bisect run ./bisect-test.sh`

## Caveats

Tests must have the same result between commits. This imposes a few challenges:
1. Changing between commits might cause false negatives in the automated test. Ex: If the elements disposition/identifiers (role, id, classname, etc) change, the test could fail, despite the feature working correctly. Make sure to run your Playwright test manually at least once in the bad and the good commit, and ensure it fails/passes respectively.
2. Playwright configuration could change between commits and skew the tests.
3. Playwright Fixtures/Page objects might change/disappear when changing between commits.
4. Server setup might change between commits, and break the server
5. Migrations could be introduced if the commit range includes a major version release. This can break the server and prevent it from starting up when going to older commits.

In summary, keep in mind that some assumptions have to be made, and there are limitations. Feel free to collaborate on the script if you found a way to improve it or make it more solid.

## How It Works

### 1. Environment Setup
- Validates required commands (node, nvm, yarn)
- Switches to the required Node.js version from `package.json`
- Installs Node.js version if not available

### 2. Test File Management
- Copies `bisect.spec.ts` to the expected test location if missing
- Ensures the e2e test file is available for each commit

### 3. Server Startup
- Installs project dependencies with `yarn install`
- Installs Playwright browsers
- Starts the development server in test mode (`TEST_MODE=true yarn dsv`)

### 4. Server Health Check
- Waits 40 seconds for initial startup
- Polls the server (http://localhost:3000) for up to 5 minutes
- Checks every 5 seconds with curl for HTTP 200 response

### 5. Test Execution
- Runs Playwright e2e tests (`yarn test:e2e`)
- Returns appropriate exit codes for git bisect

## Exit Codes

The script uses specific exit codes that git bisect understands:

- **0** (GOOD): Test passed - commit is good
- **1** (BAD): Test failed - commit is problematic  
- **125** (SKIP): Test should be skipped for this commit
- **128** (STOP): Critical error occurred - stop bisect process

PS: Skip code is not being used currently. Any foreseen error will exit the escript with the STOP code, and bisect will stop running. You can either fix the environment if this happens, or manually skip the commit. If an error stops the operation, you can just rerun the script with git-bisect and it'll keep going from where it stopped.

## Important Notes

### ⚠️ Test File/Runner
- Avoid using fixtures and page objects if possible
- The script only runs `yarn test:e2e`, so your test or describe clause should be called with `.only`
- Test file must be in the e2e tests folder
- If the test file is not in the e2e tests folder, the script will try to copy the example file from the `.scripts` folder.
- `cd apps/meteor && yarn playwright install` is ran for every commit. If the appropriate browser versions are already installed, playwright just ignores the command.

### ⚠️ Server
- Server must start successfully on port 3000. If you change the port somehow, or that port is already taken, the script will fail. You can edit the server address in the script.
- There's a possibility the server might keep running if an error happens or you exit the script prematurely.
- The way it's ensured that the server is running is through polling it's HTTP status. That polling can take up to 5 minutes, even if the startup command fails with an error. Feel free to `CTRL-C` to exit, it should most times handle SIGINT gracefully.

### ⚠️ Time Considerations
- Each test cycle takes significant time (dependency installation + server startup + tests)
- Server startup timeout is 5 minutes maximum (plus 40 seconds wait before polling starts)
- Consider this when bisecting small commit ranges. It might be faster to employ manual investigation techniques.
- Bisect uses a binary search strategy, so the bigger the range, the more efficient it becomes (log2(n)).

### ⚠️ Node Version Management
- NVM must be installed and `$NVM_DIR` env var must be set to it's actual location.
- Required node version is gotten through `package.json` (engine: { node: xxx })
- If the required node version to run the project is not installed, it will be attempted to install it using `nvm install`

PS: If you use a differente node version management tool, feel free to update the script and add support to what you use. Either test which exists and use the first valid option, or add a configuration through environment variables.

### ⚠️ Sub-Process Management
- Uses process trapping to clean up background processes
- Kills server processes on script exit or interruption

## Troubleshooting

### Common Issues

**"Missing commands" error**:
- Ensure node, nvm, and yarn are installed and in PATH
- Verify nvm is properly sourced in your shell

**Server startup timeout**:
- Check if port 3000 is already in use
- Verify the commit doesn't have broken build configuration
- Check for dependency installation failures

**Test file not found**:
- Ensure `bisect.spec.ts` exists in the `.scripts/bisect/` directory
- Check file permissions for copying

**Node version issues**:
- Verify nvm is properly installed and configured
- Check if the required Node version is available or can be installed

## Example Workflow

```bash
# 1. Navigate to repository root
cd /path/to/rocket.chat

# 2. Start bisect session
git bisect start
git bisect bad HEAD           # Current commit is bad
git bisect good <COMMIT>       # Version 6.0.0 was good

# tip: You can switch branches while setting up the bisect commits, and git-bisect will find the appropriate commit to start from once you run the script.

# 3. Manually run the script (first time)
./apps/meteor/.scripts/bisect/bisect-test.sh

# tip 2: Always run the script for the first time in latest develop branch to ensure it's the latest version.

# 4. Script will copy itself and exit, then run:
git bisect run ./bisect-test.sh

# 5. Let it run until completion
# Git will automatically find the first bad commit
```

## Files Created/Modified

- `./bisect-test.sh` - Copy of this script in repository root
- `apps/meteor/tests/e2e/bisect.spec.ts` - Test file (copied if missing)

## Cleanup

After bisect completion:
```bash
git bisect reset              # Return to original HEAD
rm ./bisect-test.sh          # Remove copied script (optional)
``` 
