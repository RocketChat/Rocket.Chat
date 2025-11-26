import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			// Node.js specific rules can be added here
		},
	},
];

