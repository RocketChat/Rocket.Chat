'use strict';

module.exports = {
	require: [
		'ts-node/register',
		'babel-mocha-es6-compiler',
		'babel-polyfill',
	],
	reporter: 'spec',
	ui: 'bdd',
	extension: 'js,ts',
	spec: [
		'app/**/*.tests.js',
		'app/**/*.tests.ts',
	],
};
