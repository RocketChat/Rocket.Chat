'use strict';

/**
 * Mocha configuration for general unit tests.
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
	exit: true,
	spec: ['app/**/*.spec.ts', 'app/**/*.tests.js', 'app/**/*.tests.ts', 'server/**/*.tests.ts', 'ee/**/*.tests.ts', 'lib/**/*.spec.ts'],
};
