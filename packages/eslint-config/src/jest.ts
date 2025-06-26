// @ts-check
import jest from 'eslint-plugin-jest';
import globals from 'globals';

/**
 * @type {import('typescript-eslint').ConfigWithExtends}
 */
export const config = {
	files: ['**/*.spec.js', '**/*.test.js', '**/*.tests.js', '**/*.mock.js'],
	plugins: { jest },
	languageOptions: {
		globals: globals.jest,
		parserOptions: {
			projectService: {
				allowDefaultProject: ['jest.config.js', 'jest.config.mjs'],
			},
		},
	},
	rules: {
		'jest/no-disabled-tests': 'warn',
		'jest/no-focused-tests': 'warn',
		'jest/no-identical-title': 'warn',
		'jest/prefer-to-have-length': 'warn',
		'jest/valid-expect': 'warn',
	},
};
