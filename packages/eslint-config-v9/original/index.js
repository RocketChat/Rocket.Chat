import bestPractices from '../best-practices/index.js';
import errors from '../errors/index.js';
import node from '../node/index.js';
import style from '../style/index.js';
import variables from '../variables/index.js';
import es6 from '../es6/index.js';
import imports from '../imports/index.js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	...bestPractices,
	...errors,
	...node,
	...style,
	...variables,
	...es6,
	...imports,
	{
		languageOptions: {
			sourceType: 'module',
			ecmaVersion: 2018,
			parserOptions: {
				ecmaFeatures: {
					generators: false,
					objectLiteralDuplicateProperties: false,
				},
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
	},
];

