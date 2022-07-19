'use strict';

/**
 * Mocha configuration for REST API integration tests.
 */

module.exports = {
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	timeout: 10000,
	bail: true,
	file: 'tests/end-to-end/teardown.js',
	spec: [
		'tests/unit/app/api/server/v1/**/*.spec.ts',
		'tests/end-to-end/api/**/*.js',
		'tests/end-to-end/api/**/*.ts',
		'tests/end-to-end/apps/*.js',
		'tests/end-to-end/apps/*.ts',
	],
};
