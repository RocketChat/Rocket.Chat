'use strict';

/*
 * Mocha configuration for REST API integration tests.
 */

module.exports = /** @satisfies {import('mocha').MochaOptions} */ ({
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	timeout: 10000,
	slow: 6000, // Only show time for tests slower than 6 seconds
	bail: true,
	retries: 0,
	file: 'tests/end-to-end/teardown.ts',
	spec: ['tests/end-to-end/federation/**/*'],
	ignore: ['tests/end-to-end/federation/**/*.env*'],
	require: [
		'ts-node/register',
		'./tests/setup/chaiPlugins.ts'
	],
});
