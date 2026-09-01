'use strict';

/**
 * Mocha configuration for general unit tests.
 */

const base = require('./.mocharc.base.json');

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	exit: true,
	// getUserInfo.spec.ts lives under server/api/lib but is a Jest test (run via jest.config.ts),
	// so it must be excluded from the mocha `server/api/lib/**` glob below. Same for the
	// business-hour spec under server/lib/omnichannel.
	ignore: ['server/api/lib/getUserInfo.spec.ts', 'server/lib/omnichannel/business-hour/**/*.spec.ts'],
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
		'tests/unit/server/**/*.tests.js',
		'tests/unit/server/**/*.tests.ts',
		'tests/unit/server/**/*.spec.ts',
		'server/lib/2fa/**/*.spec.ts',
		'server/api/lib/**/*.spec.ts',
		'server/lib/media/**/*.spec.ts',
		'server/lib/statistics/**/*.spec.ts',
		'server/meteor-methods/**/*.spec.ts',
		'server/lib/omnichannel/**/*.spec.ts',
		'server/lib/notifications/push/**/*.spec.ts',
		'server/lib/utils/**/*.spec.ts',
	],
};
