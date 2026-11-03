import { describe, it } from 'node:test';

import { expect } from 'chai';

import { shouldExitOnUncaughtError } from './shouldExitOnUncaughtError';

describe('shouldExitOnUncaughtError', () => {
	it('should exit while the server is not serving yet', () => {
		expect(shouldExitOnUncaughtError({ serving: false, env: {} })).to.equal(true);
	});

	it('should keep the process running once the server is serving', () => {
		expect(shouldExitOnUncaughtError({ serving: true, env: {} })).to.equal(false);
	});

	it('should exit once serving when EXIT_UNHANDLEDPROMISEREJECTION is set', () => {
		expect(shouldExitOnUncaughtError({ serving: true, env: { EXIT_UNHANDLEDPROMISEREJECTION: 'true' } })).to.equal(true);
	});

	it('should exit once serving in test mode and in development', () => {
		expect(shouldExitOnUncaughtError({ serving: true, env: { TEST_MODE: 'true' } })).to.equal(true);
		expect(shouldExitOnUncaughtError({ serving: true, env: { NODE_ENV: 'development' } })).to.equal(true);
	});
});
