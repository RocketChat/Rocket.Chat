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
	spec: [
		'lib/callbacks.spec.ts',
		'server/lib/ldap/*.spec.ts',
		'server/lib/ldap/**/*.spec.ts',
		'ee/server/lib/ldap/*.spec.ts',
		'ee/tests/**/*.tests.ts',
		'ee/tests/**/*.spec.ts',
		'tests/unit/app/**/*.spec.ts',
		'tests/unit/app/**/*.tests.js',
		'tests/unit/app/**/*.tests.ts',
		'tests/unit/lib/**/*.tests.ts',
		'server/routes/avatar/**/*.spec.ts',
		'tests/unit/lib/**/*.spec.ts',
		'tests/unit/server/**/*.tests.ts',
		'tests/unit/server/**/*.spec.ts',
		'app/api/server/lib/**/*.spec.ts',
		'app/file-upload/server/**/*.spec.ts',
	],
};
