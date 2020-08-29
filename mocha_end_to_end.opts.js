'use strict';

module.exports = {
	require: [
		'babel-mocha-es6-compiler',
		'babel-polyfill',
	],
	reporter: 'spec',
	ui: 'bdd',
	extension: 'js,ts',
	timeout: 10000,
	bail: true,
	file: 'tests/end-to-end/teardown.js',
	spec: [
		'tests/end-to-end/api/*.js',
		'tests/end-to-end/apps/*.js',
	],
};
