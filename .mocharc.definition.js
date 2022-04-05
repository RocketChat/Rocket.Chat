'use strict';

/**
 * Mocha configuration for unit tests for type guards.
 */

const base = require('./.mocharc.base.json');

/**
 * Mocha will run `ts-node` without doing type checking to speed-up the tests. It should be fine as `npm run typecheck`
 * covers test files too.
 */

Object.assign(
	process.env,
	{
		TS_NODE_FILES: true,
		TS_NODE_TRANSPILE_ONLY: true,
	},
	process.env,
);

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	require: [...base.require],
	exit: false,
	slow: 200,
	spec: ['tests/unit/definition/**/*.spec.ts'],
};
