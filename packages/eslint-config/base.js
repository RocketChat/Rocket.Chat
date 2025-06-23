// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * A shared ESLint configuration for the repository
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const config = tseslint.config(
	[
		js.configs.recommended,
		{
			rules: {
				'no-unused-expressions': 'warn',
				'no-async-promise-executor': 'warn',
				'no-case-declarations': 'warn',
				'no-prototype-builtins': 'warn',
				'no-await-in-loop': 'warn',
				'no-unsafe-optional-chaining': 'warn',
			},
		},
	],
	tseslint.configs.eslintRecommended,
	prettier,
	[
		...tseslint.configs.recommended,
		{
			rules: {
				'@typescript-eslint/no-explicit-any': 'warn',
				'@typescript-eslint/no-empty-object-type': 'warn',
				'@typescript-eslint/no-empty-interface': 'warn',
				'@typescript-eslint/naming-convention': [
					'warn',
					{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
					{
						selector: ['variable'],
						format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
						leadingUnderscore: 'allowSingleOrDouble',
					},
					{
						selector: ['function'],
						format: ['camelCase', 'PascalCase'],
						leadingUnderscore: 'allowSingleOrDouble',
					},
					{
						selector: 'parameter',
						format: ['camelCase'],
						modifiers: ['unused'],
						leadingUnderscore: 'require',
					},
					{
						selector: 'interface',
						format: ['PascalCase'],
						custom: {
							regex: '^I[A-Z]',
							match: true,
						},
					},
				],
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						argsIgnorePattern: '^_',
						ignoreRestSiblings: true,
						caughtErrors: 'none',
					},
				],
				'@typescript-eslint/no-unused-expressions': 'warn',
			},
		},
	],
	{
		ignores: ['**/dist/**'],
	},
	{
		files: ['babel.config.js', 'webpack.config.js', '.prettierrc.js', '**/scripts/**/*.js', '**/scripts/**/*.mjs'],
		languageOptions: {
			globals: globals.node,
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'warn',
		},
	},
);
