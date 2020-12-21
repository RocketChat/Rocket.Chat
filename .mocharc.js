'use strict';

module.exports = {
	require: [
		'ts-node/register',
		'@babel/register',
	],
	reporter: 'spec',
	ui: 'bdd',
	extension: ['js', 'ts'],
	spec: [
		'app/**/*.tests.js',
		'app/**/*.tests.ts',
		'server/**/*.tests.ts',
		'client/**/*.spec.ts',
	],
};
