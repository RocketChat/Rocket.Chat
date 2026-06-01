'use strict';

/*
 * Mocha configuration for Livechat REST API integration tests.
 */

module.exports = /** @satisfies {import('mocha').MochaOptions} */ ({
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	timeout: 10000,
	bail: true,
	retries: 0,
	file: 'tests/end-to-end/teardown.ts',
	reporter: 'tests/end-to-end/reporter.ts',
	spec: ['tests/end-to-end/api/livechat/**/*'],
});
