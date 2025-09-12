'use strict';

/*
 * Mocha configuration for REST API integration tests.
 */

module.exports = /** @satisfies {import('mocha').MochaOptions} */ ({
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	timeout: 10000,
	bail: true,
	retries: 0,
	file: 'tests/end-to-end/teardown.ts',
	spec: ['tests/end-to-end/api/**/*', 'tests/end-to-end/apps/*'],
	// Add GitHub summary reporter when running in CI
	reporter: process.env.CI ? './reporters/mocha-github-summary.js' : 'spec',
	reporterOptions: {
		outputPath: process.env.GITHUB_SUMMARY_PATH || 'test-summary-api.json',
	},
});
