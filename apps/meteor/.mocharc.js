'use strict';

/**
 * Mocha configuration for general unit tests.
 */

const base = require('./.mocharc.base.json');

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	exit: true,
	// getUserInfo.spec.ts lives under server/api/lib but is a Jest test (run via jest.config.ts),
	// so it must be excluded from the mocha `server/api/lib/**` glob below.
	ignore: ['server/api/lib/getUserInfo.spec.ts'],
	spec: [
		'server/lib/callbacks.spec.ts',
		'server/lib/cas/*.spec.ts',
		'server/lib/messages/**/*.spec.ts',
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
		'app/2fa/server/**/*.spec.ts',
		'server/api/lib/**/*.spec.ts',
		'app/file-upload/server/**/*.spec.ts',
		'app/statistics/server/**/*.spec.ts',
		'app/livechat/server/lib/**/*.spec.ts',
		'app/push/server/**/*.spec.ts',
		'app/utils/server/**/*.spec.ts',
	],
};
