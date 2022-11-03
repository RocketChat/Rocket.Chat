'use strict';

/**
 * Mocha configuration for client-side unit and integration tests.
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
	require: [
		...base.require,
		'./tests/setup/registerWebApiMocks.ts',
		'./tests/setup/hoistedReact.ts',
		'./tests/setup/cleanupTestingLibrary.ts',
	],
	exit: false,
	slow: 200,
	spec: [
		'tests/unit/client/**/*.spec.ts',
		'tests/unit/lib/**/*.tests.ts',
		'tests/unit/client/**/*.test.ts',
		'tests/unit/client/**/*.spec.tsx',
	],
};
