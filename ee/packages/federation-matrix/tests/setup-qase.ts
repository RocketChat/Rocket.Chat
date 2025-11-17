/**
 * Jest setup file that automatically wraps describe and it/test functions
 * to register suites and tests with Qase.
 *
 * The Qase Jest reporter reports the directory structure up from the tests directory,
 * making it not consistent with the test suite structure we currently follow in Qase.
 * The solution is to wrap describe and it/test functions to automatically set the suite
 * at the very start of the test to what we really want the reporting structure to be.
 *
 * This file is loaded via setupFilesAfterEnv in jest.config.federation.ts.
 * Qase integration is only enabled when QASE_TESTOPS_JEST_API_TOKEN is set.
 */

import { qase } from 'jest-qase-reporter/jest';

const ROOT_SUITE = 'Rocket.Chat Federation Automation';

/**
 * Stack to track the current suite path hierarchy
 */
const suitePathStack: string[] = [];

/**
 * Store the original Jest describe function before we replace it
 */
const originalDescribe = global.describe;

/**
 * Gets the full suite path including root
 */
function getFullSuitePath(): string {
	return [ROOT_SUITE, ...suitePathStack].join('\t');
}

/**
 * Wraps describe to automatically track suite hierarchy and set suite for tests
 */
function describeImpl(name: string, fn: () => void): void {
	suitePathStack.push(name);
	const currentPath = getFullSuitePath();

	originalDescribe(name, () => {
		// Add beforeEach to set suite for all tests in this describe block
		// This must be called before the test runs so the reporter picks it up
		global.beforeEach(() => {
			qase.suite(currentPath);
		});

		// Store current it and test wrappers (they might be wrapped by parent describe)
		const currentIt = global.it;
		const currentTest = global.test;

		// Wrap it() to automatically set suite at the very start
		global.it = ((testName: any, fn?: any, timeout?: number) => {
			// Handle qase-wrapped test names (qase returns a string)
			if (typeof testName === 'string' && fn) {
				return currentIt(
					testName,
					async () => {
						// Set suite immediately at the start of the test
						qase.suite(currentPath);
						// Call the original test function and return the result
						return fn();
					},
					timeout,
				);
			}
			// Handle cases where testName might be a number or other type
			return currentIt(testName, fn, timeout);
		}) as typeof global.it;

		// Wrap test() to automatically set suite at the very start
		global.test = ((testName: any, fn?: any, timeout?: number) => {
			if (typeof testName === 'string' && fn) {
				return currentTest(
					testName,
					async () => {
						// Set suite immediately at the start of the test
						qase.suite(currentPath);
						// Call the original test function and return the result
						return fn();
					},
					timeout,
				);
			}
			return currentTest(testName, fn, timeout);
		}) as typeof global.test;

		// Execute the describe block
		fn();

		// Restore previous wrappers
		global.it = currentIt;
		global.test = currentTest;
	});

	suitePathStack.pop();
}

// Only apply qase wrapping if the environment variable is set
if (process.env.QASE_TESTOPS_JEST_API_TOKEN) {
	// Replace global describe with our wrapper
	(global as any).describe = Object.assign(describeImpl, {
		skip: (name: string, fn: () => void) => originalDescribe.skip(name, fn),
		only: (name: string, fn: () => void) => originalDescribe.only(name, fn),
	}) as typeof global.describe;
}
