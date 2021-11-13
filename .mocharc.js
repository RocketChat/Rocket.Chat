'use strict';

module.exports = {
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	spec: [
		'app/**/*.tests.js',
		'app/**/*.tests.ts',
		'app/**/*.spec.ts',
		'server/**/*.tests.ts',
		'client/**/*.spec.ts',
	],
	exit: true,
};
