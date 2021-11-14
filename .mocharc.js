'use strict';

module.exports = {
	...require('./.mocharc.base.json'), // see https://github.com/mochajs/mocha/issues/3916
	spec: [
		'app/**/*.spec.ts',
		'app/**/*.tests.js',
		'app/**/*.tests.ts',
		'server/**/*.tests.ts',
	],
	exit: true,
};
