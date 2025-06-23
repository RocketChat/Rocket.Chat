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
				'no-unused-expressions': 'off',
				'no-async-promise-executor': 'off',
				'no-case-declarations': 'off',
				'no-prototype-builtins': 'off',
				'no-await-in-loop': 'error',
			},
		},
	],
	tseslint.configs.eslintRecommended,
	prettier,
	[
		...tseslint.configs.recommended,
		{
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-empty-object-type': 'off',
				'@typescript-eslint/naming-convention': [
					'error',
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
					'error',
					{
						argsIgnorePattern: '^_',
						ignoreRestSiblings: true,
						caughtErrors: 'none',
					},
				],
				'@typescript-eslint/no-unused-expressions': 'off',
			},
		},
	],
	{
		ignores: ['**/dist/**',],
	},
	{
		files: ['babel.config.js', 'webpack.config.js'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
		languageOptions: {
			globals: globals.node
		},
	},
	{
		files: ['**/scripts/**/*.js', '**/scripts/**/*.mjs'],
		languageOptions: {
			globals: globals.node
		}
	}
);
