// @ts-check
import mocha from 'eslint-plugin-mocha';
import globals from 'globals';

export const config = {
	files: ['**/*.spec.js', '**/*.test.js', '**/*.tests.js', '**/*.mock.js'],
	plugins: { mocha },
	languageOptions: {
		globals: globals.mocha,
	},
};
