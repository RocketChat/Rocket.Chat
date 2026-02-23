import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig} */
export default {
	languageOptions: {
		globals: {
			...globals.node,
		},
	},
};
