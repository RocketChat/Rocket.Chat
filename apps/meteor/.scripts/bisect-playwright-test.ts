#!/usr/bin/env node

import { spawn, type ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

interface IProcessResult {
	exitCode: number | null;
	signal: string | null;
}

// TODO: export bisect log with first good and bad commit so that it can be replayed if the script causes issues (avoid having to re-setup the good and bad commits).
// TODO: Test file in the script folder so that it can be copied to the test folder each time the commits change
// TODO: make script Copy itself and test file to the root directory (so that commits can be safely switched without losing the script between runs)
// TODO: Fix playwright running twice if test fails ("NVM not found" when infact the test just failed)
// TODO: Make a test runner just for bisecting, so that commit switches do not screw up the test.
// TODO: Fix non-test and non-enviroment setup errors triggering the skip exit code (some errors should exit with 126 in order to stay in the same commit, for example if NVM fails it shouldn't skip the commit, just warn the user)

/**
 * Git bisect exit codes:
 * - 0: current source code is good/old (test passed)
 * - 1-127 (except 125): current source code is bad/new (test failed)
 * - 125: current source code cannot be tested (should be skipped)
 */
enum BisectExitCode {
	GOOD = 0,
	BAD = 1,
	SKIP = 125,
}

class BisectTestRunner {
	private readonly testCommand: string;

	private readonly serverUrl: string = 'http://localhost:3000';

	private readonly maxRetries: number = 60; // Wait up to 5 minutes (60 * 5s)

	private readonly retryInterval: number = 5000; // 5 seconds

	private serverProcess: ChildProcess | null = null;

	constructor(testCommand: string) {
		this.testCommand = testCommand;
	}

	/**
	 * Runs a shell command and returns a promise that resolves when the command completes
	 */
	private runCommand(
		command: string,
		args: string[] = [],
		options: { cwd?: string; env?: Record<string, string>; timeout?: number } = {},
	): Promise<IProcessResult> {
		return new Promise((resolve, reject) => {
			const { cwd = process.cwd(), env = {}, timeout } = options;

			console.log(`Running: ${command} ${args.join(' ')}`);

			const childProcess = spawn(command, args, {
				cwd,
				env: { ...process.env, ...env },
				stdio: 'pipe',
				shell: true,
			});

			childProcess.stdout?.on('data', (data) => {
				process.stdout.write(data);
			});

			childProcess.stderr?.on('data', (data) => {
				process.stderr.write(data);
			});

			const timeoutId = timeout
				? setTimeout(() => {
						childProcess.kill('SIGTERM');
						reject(new Error(`Command timed out after ${timeout}ms`));
					}, timeout)
				: null;

			childProcess.on('close', (code, signal) => {
				if (timeoutId) clearTimeout(timeoutId);
				resolve({ exitCode: code, signal });
			});

			childProcess.on('error', (error) => {
				if (timeoutId) clearTimeout(timeoutId);
				reject(error);
			});
		});
	}

	/**
	 * Checks if the server is running by making an HTTP request
	 */
	private async checkServerHealth(): Promise<boolean> {
		try {
			// Use node's built-in http module to avoid external dependencies
			const http = await import('http');

			return new Promise<boolean>((resolve) => {
				const req = http.request(this.serverUrl, { method: 'HEAD', timeout: 2000 }, (res) => {
					resolve(res.statusCode === 200);
				});

				req.on('error', () => resolve(false));
				req.on('timeout', () => {
					req.destroy();
					resolve(false);
				});

				req.end();
			});
		} catch (error) {
			console.log(`Health check failed: ${error}`);
			return false;
		}
	}

	/**
	 * Waits for the server to be ready by polling the health endpoint
	 */
	private async waitForServer(): Promise<void> {
		console.log(`Waiting for server to be ready at ${this.serverUrl}...`);

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			// eslint-disable-next-line no-await-in-loop
			const isReady = await this.checkServerHealth();

			if (isReady) {
				console.log(`Server is ready after ${attempt} attempts`);
				return;
			}

			console.log(`Attempt ${attempt}/${this.maxRetries}: Server not ready, waiting ${this.retryInterval / 1000}s...`);
			// eslint-disable-next-line no-await-in-loop
			await sleep(this.retryInterval);
		}

		throw new Error(`Server did not become ready after ${(this.maxRetries * this.retryInterval) / 1000} seconds`);
	}

	/**
	 * Starts the development server
	 */
	private async startServer(): Promise<void> {
		console.log('Starting development server...');

		const env = {
			TEST_MODE: 'true',
			NODE_OPTIONS: '--trace-warnings',
		};

		// Change to the root directory to run yarn dsv
		const rootDir = path.resolve(__dirname, '../../../');
		const command = await this.getNodeCommand('yarn dsv');

		this.serverProcess = spawn(command, [], {
			cwd: rootDir,
			env: { ...process.env, ...env },
			stdio: 'pipe',
			shell: true,
		});

		// Log server output
		this.serverProcess.stdout?.on('data', (data) => {
			process.stdout.write(`[SERVER] ${data}`);
		});

		this.serverProcess.stderr?.on('data', (data) => {
			process.stderr.write(`[SERVER] ${data}`);
		});

		this.serverProcess.on('close', (code, signal) => {
			console.log(`Server process exited with code ${code} and signal ${signal}`);
		});

		// Give the server some time to start before checking health
		await sleep(30000); // Wait 30 seconds before first health check
	}

	/**
	 * Stops the development server
	 */
	private async stopServer(): Promise<void> {
		if (this.serverProcess) {
			console.log('Stopping development server...');
			this.serverProcess.kill('SIGTERM');

			// Give it time to shut down gracefully
			await sleep(5000);

			if (!this.serverProcess.killed) {
				console.log('Force killing server process...');
				this.serverProcess.kill('SIGKILL');
			}

			this.serverProcess = null;
		}
	}

	/**
	 * Reads the required Node.js version from package.json
	 */
	private getRequiredNodeVersion(): string | null {
		try {
			const rootDir = path.resolve(__dirname, '../../../');
			const packageJsonPath = path.join(rootDir, 'package.json');

			if (!fs.existsSync(packageJsonPath)) {
				console.log('package.json not found, skipping Node.js version check');
				return null;
			}

			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

			// Check engines.node first
			if (packageJson.engines?.node) {
				return packageJson.engines.node;
			}

			// Check volta.node as fallback
			if (packageJson.volta?.node) {
				return packageJson.volta.node;
			}

			console.log('No Node.js version specified in package.json');
			return null;
		} catch (error) {
			console.log(`Error reading Node.js version from package.json: ${error}`);
			return null;
		}
	}

	/**
	 * Gets the command to run with the correct Node.js version
	 */
	private async getNodeCommand(baseCommand: string): Promise<string> {
		const requiredVersion = await this.getRequiredNodeVersion();

		if (!requiredVersion) {
			return baseCommand;
		}

		// Simple NVM command - if it fails, the error will be logged but won't skip the commit
		return `source ~/.nvm/nvm.sh && nvm use ${requiredVersion} && ${baseCommand} || { echo "NVM not found or failed, continuing with current Node.js version"; ${baseCommand}; }`;
	}

	/**
	 * Attempts to install the required Node.js version via nvm (non-blocking)
	 */
	private async setupNodeVersion(): Promise<void> {
		const requiredVersion = this.getRequiredNodeVersion();

		if (!requiredVersion) {
			console.log('No specific Node.js version required, using current version');
			return;
		}

		console.log(`Required Node.js version: ${requiredVersion}`);
		console.log('Attempting to install/setup Node.js version with NVM...');

		try {
			// Try to install the required version - if this fails, we continue anyway
			const installCommand = `source ~/.nvm/nvm.sh && nvm install ${requiredVersion} && nvm use ${requiredVersion} && node --version || echo "NVM setup failed, continuing with current Node.js version"`;

			// const result = await this.runCommand('zsh', [installCommand], {
			// 	timeout: 600000, // 10 minutes timeout for Node.js installation
			// });

			const result = await this.runCommand(installCommand, [], {
				timeout: 600000, // 10 minutes timeout for Node.js installation
			});

			if (result.exitCode === 0) {
				console.log(`Successfully set up Node.js version ${requiredVersion}`);
			} else {
				console.log(`Could not set up Node.js version ${requiredVersion}, continuing with current version`);
			}
		} catch (error) {
			console.log(`NVM setup failed: ${error}`);
			console.log('Continuing with current Node.js version');
		}
	}

	/**
	 * Installs dependencies
	 */
	private async installDependencies(): Promise<void> {
		console.log('Installing dependencies...');

		// Change to the root directory to run yarn
		const rootDir = path.resolve(__dirname, '../../../');
		const command = await this.getNodeCommand('yarn install');

		const result = await this.runCommand(command, [], {
			cwd: rootDir,
			timeout: 300000, // 5 minutes timeout for yarn install
		});

		if (result.exitCode !== 0) {
			throw new Error(`Failed to install dependencies. Exit code: ${result.exitCode}`);
		}
	}

	/**
	 * Installs Playwright browsers for the current commit's version
	 */
	private async installPlaywright(): Promise<void> {
		console.log('Installing Playwright browsers...');

		// Change to meteor app directory to run playwright install
		const meteorDir = path.resolve(__dirname, '../');
		const command = await this.getNodeCommand('yarn playwright install');

		const result = await this.runCommand(command, [], {
			cwd: meteorDir,
			timeout: 300000, // 5 minutes timeout for playwright install
		});

		if (result.exitCode !== 0) {
			throw new Error(`Failed to install Playwright browsers. Exit code: ${result.exitCode}`);
		}
	}

	/**
	 * Runs the specified Playwright test
	 */
	private async runPlaywrightTest(): Promise<IProcessResult> {
		console.log(`Running Playwright test: ${this.testCommand}`);

		// Change to meteor app directory to run the test
		const meteorDir = path.resolve(__dirname, '../');

		// Parse the test command - it might be something like "test:e2e --grep 'test name'"
		const [command, ...args] = this.testCommand.split(' ');
		const yarnCommand = `yarn ${command} ${args.join(' ')}`;
		const fullCommand = await this.getNodeCommand(yarnCommand);

		return this.runCommand(fullCommand, [], {
			cwd: meteorDir,
			timeout: 600000, // 10 minutes timeout for tests
		});
	}

	/**
	 * Main execution method
	 */
	async run(): Promise<void> {
		try {
			// Setup the correct Node.js version
			await this.setupNodeVersion();

			// Install dependencies
			await this.installDependencies();

			// Install Playwright browsers for the current version
			await this.installPlaywright();

			// Start the server
			await this.startServer();

			// Wait for server to be ready
			await this.waitForServer();

			// Run the test
			const testResult = await this.runPlaywrightTest();

			// Evaluate test results and exit with appropriate code
			if (testResult.exitCode === 0) {
				console.log('Test passed - marking commit as GOOD');
				process.exit(BisectExitCode.GOOD);
			} else {
				console.log(`Test failed with exit code ${testResult.exitCode} - marking commit as BAD`);
				process.exit(BisectExitCode.BAD);
			}
		} catch (error) {
			console.error(`Error during bisect test execution: ${error}`);

			// If there's an error that prevents testing (e.g., build failure),
			// we should skip this commit
			console.log('Marking commit as SKIP due to error');
			process.exit(BisectExitCode.SKIP);
		} finally {
			// Always try to clean up the server
			await this.stopServer();
		}
	}
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
	// Get the test command from command line arguments
	const testCommand = process.argv[2];

	if (!testCommand) {
		console.error('Usage: ts-node bisect-playwright-test.ts <test-command>');
		console.error('Example: ts-node bisect-playwright-test.ts "test:e2e --grep \\"login test\\""');
		process.exit(1);
	}

	console.log(`Git Bisect Playwright Test Runner`);
	console.log(`Test command: ${testCommand}`);
	console.log(`Starting bisect test execution...`);

	const runner = new BisectTestRunner(testCommand);
	await runner.run();
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
	console.log('\nReceived SIGINT, shutting down gracefully...');
	process.exit(BisectExitCode.SKIP);
});

process.on('SIGTERM', async () => {
	console.log('\nReceived SIGTERM, shutting down gracefully...');
	process.exit(BisectExitCode.SKIP);
});

// Run the main function
if (require.main === module) {
	main().catch((error) => {
		console.error('Unhandled error:', error);
		process.exit(BisectExitCode.SKIP);
	});
}
