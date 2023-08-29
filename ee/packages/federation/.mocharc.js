'use strict';

Object.assign(
	process.env,
	{
		TS_NODE_FILES: true,
		TS_NODE_TRANSPILE_ONLY: true,
	},
	process.env,
);

module.exports = {
	'reporter': 'spec',
	'extension': ['js', 'ts'],
	'require': ['ts-node/register', './tests/setup/chaiPlugins.ts'],
	'watch-files': ['./**/*.js', './**/*.ts'],
	'exit': true,
	'spec': [
		'tests/unit/**/*.spec.ts'
	],
};
