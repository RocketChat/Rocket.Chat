'use strict';

const base = require('./.mocharc.base.json');

module.exports = {
	...base, // see https://github.com/mochajs/mocha/issues/3916
	require: [
		...base.require,
		'./tests/mocks/client/register.ts',
		'./tests/setup/cleanupTestingLibrary.ts',
	],
	spec: [
		'client/**/*.spec.ts',
		'client/**/*.spec.tsx',
	],
	exit: true,
};
