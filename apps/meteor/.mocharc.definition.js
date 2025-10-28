'use strict';

/**
 * Mocha configuration for unit tests for type guards.
 */

const base = require('./.mocharc.base.json');

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	require: [...base.require],
	exit: false,
	slow: 200,
	spec: ['tests/unit/definition/**/*.spec.ts'],
};
