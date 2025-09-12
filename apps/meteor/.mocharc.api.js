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
});
