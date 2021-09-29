'use strict';

module.exports = {
	require: [
		'babel-mocha-es6-compiler',
		'babel-polyfill',
	],
	reporter: 'spec',
	ui: 'bdd',
	extension: 'js,ts',
	// 1 min timout is acceptable in CI
	timeout: 60000,
	bail: true,
	file: 'tests/end-to-end/teardown.js',
	spec: [
		'tests/end-to-end/apps/*.js',
	],
};
