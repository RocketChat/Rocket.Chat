'use strict';

module.exports = {
	require: [
		'@babel/register',
		'regenerator-runtime/runtime',
		'ts-node/register',
		'./tests/setup/chaiPlugins.ts',
	],
	reporter: 'spec',
	ui: 'bdd',
	extension: ['js', 'ts'],
	spec: [
		'app/**/*.tests.js',
		'app/**/*.tests.ts',
		'app/**/*.spec.ts',
		'server/**/*.tests.ts',
		'client/**/*.spec.ts',
	],
};
