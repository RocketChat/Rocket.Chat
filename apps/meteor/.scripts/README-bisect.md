# Git Bisect Playwright Test Runner

This script helps you automatically find the commit that introduced a bug by running Playwright tests with `git bisect`.

## Overview

The bisect script does the following:
1. Checks the required Node.js version from `package.json` and sets it up using `nvm` if needed
2. Installs dependencies with `yarn`
3. Installs Playwright browsers for the current commit's version (`yarn playwright install`)
4. Starts the development server with `TEST_MODE=true yarn dsv`
5. Waits for the server to be ready (polls HTTP endpoint until it returns 200)
6. Runs a specific Playwright test (provided as argument)
7. Evaluates test results and exits with appropriate codes for git bisect

## Files

- `bisect-playwright-test.ts` - Main TypeScript implementation
- `bisect-test.sh` - Shell wrapper script for easier usage
- `README-bisect.md` - This documentation

## Usage

### Basic Usage with Git Bisect

1. **Start a bisect session:**
   ```bash
   git bisect start
   git bisect bad                    # Current commit is bad
   git bisect good <known-good-commit>  # A commit where the test passed
   ```

2. **Run the bisect with your test:**
   ```bash
   git bisect run apps/meteor/.scripts/bisect-test.sh "test:e2e --grep 'your test name'"
   ```

3. **Clean up when done:**
   ```bash
   git bisect reset
   ```

### Example

Finding when a login test started failing:

```bash
# Start bisect session
git bisect start
git bisect bad HEAD
git bisect good v6.0.0

# Run bisect with specific test
git bisect run apps/meteor/.scripts/bisect-test.sh "test:e2e --grep 'should login successfully'"

# Clean up
git bisect reset
```

### Test Command Examples

- Run all e2e tests: `"test:e2e"`
- Run specific test by name: `"test:e2e --grep 'login test'"`
- Run tests in specific file: `"test:e2e tests/e2e/login.spec.ts"`
- Run federation tests: `"test:e2e:federation"`

### Manual Usage

You can also run the TypeScript script directly:

```bash
cd apps/meteor
TS_NODE_COMPILER_OPTIONS='{"module": "commonjs"}' npx ts-node .scripts/bisect-playwright-test.ts "test:e2e --grep 'your test'"
```

## Exit Codes

The script follows git bisect conventions:
- **0**: Test passed (commit is GOOD)
- **1-127** (except 125): Test failed (commit is BAD)  
- **125**: Cannot test this commit (SKIP - e.g., build failure)

## Configuration

### Node.js Version Management
- Automatically reads Node.js version from `package.json` (`engines.node` or `volta.node`)
- Uses `nvm` to install and switch to the required version if needed
- Falls back to current Node.js version if no specific version is required

### Timeouts
- Node.js installation: 10 minutes (if needed)
- Dependency installation: 5 minutes
- Playwright browser installation: 5 minutes
- Server startup wait: 5 minutes (60 attempts × 5s)
- Test execution: 10 minutes

### Server
- Default URL: `http://localhost:3000`
- Health check: HEAD request to server URL
- Startup delay: 10 seconds before first health check

## Troubleshooting

### Server Won't Start
- Check if port 3000 is available
- Ensure all dependencies are properly installed
- Look at server logs for build errors

### Tests Fail to Run
- Verify the test command syntax
- Ensure Playwright is properly configured
- Check that test files exist
- Playwright browsers are automatically installed for each commit's version

### Node.js Version Issues
- If `nvm` is not installed, the script will warn but continue with the current Node.js version
- If a required Node.js version can't be installed, the commit will be skipped
- The script checks both `engines.node` and `volta.node` in package.json

### Build Failures
- The script will automatically skip commits that can't build (exit code 125)
- Check yarn.lock and package.json for dependency issues

### Performance
- The script does a full `yarn install` for each commit to ensure dependencies are correct
- Node.js versions are automatically managed per commit
- Playwright browsers are automatically installed for each commit's version
- Consider using `--first-parent` with git bisect for faster execution on merge-heavy histories

## Advanced Usage

### Skipping Merge Commits
```bash
git bisect start --first-parent
```

### Testing Specific File Changes
```bash
git bisect start HEAD v6.0.0 -- apps/meteor/client/views/login/
```

### Custom Environment Variables
Modify the `startServer()` method in `bisect-playwright-test.ts` to add custom environment variables:

```typescript
const env = {
    TEST_MODE: 'true',
    NODE_OPTIONS: '--trace-warnings',
    CUSTOM_VAR: 'custom_value',  // Add your variables here
};
```

## Dependencies

The script uses only Node.js built-in modules:
- `child_process` - For running commands
- `http` - For health checks  
- `path` - For file path resolution
- `fs` - For reading package.json files
- `util` - For promisify

External tools required:
- `yarn` - Package manager
- `npx` - For running ts-node
- `ts-node` - For running TypeScript directly
- `nvm` - For Node.js version management (optional but recommended) 