import jest from 'eslint-plugin-jest';

export const config = {
	// update this to match your test files
	files: ['**/*.spec.js', '**/*.test.js', '**/*.tests.js', '**/*.mock.js'],
	plugins: { jest },
	languageOptions: {
		globals: jest.environments.globals.globals,
	},
	rules: {
		'jest/no-disabled-tests': 'warn',
		'jest/no-focused-tests': 'warn',
		'jest/no-identical-title': 'warn',
		'jest/prefer-to-have-length': 'warn',
		'jest/valid-expect': 'warn',
	},
};
