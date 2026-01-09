'use strict';

/**
 * Mocha configuration for general unit tests.
 */

const base = require('./.mocharc.base.json');

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	exit: true,
	spec: [
		'lib/callbacks.spec.ts',
		'server/lib/ldap/*.spec.ts',
		'server/lib/ldap/**/*.spec.ts',
		'server/lib/dataExport/**/*.spec.ts',
		'server/ufs/*.spec.ts',
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
		'app/statistics/server/**/*.spec.ts',
	],
};
