// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { importX } from 'eslint-plugin-import-x';
import security from 'eslint-plugin-security';

/**
 * A shared ESLint configuration for the repository
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const config = tseslint.config(
	eslint.configs.recommended,
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	prettier,
	tseslint.configs.recommendedTypeChecked,
	security.configs.recommended,
	{
		rules: {
			'no-unused-expressions': 'warn',
			'no-async-promise-executor': 'warn',
			'no-case-declarations': 'warn',
			'no-prototype-builtins': 'warn',
			'no-await-in-loop': 'warn',
			'no-unsafe-optional-chaining': 'warn',
			'no-useless-catch': 'warn',
			'no-useless-escape': 'warn',
			'no-constant-binary-expression': 'warn',
			'prefer-const': 'warn',
		},
	},
	{
		rules: {
			'import-x/namespace': 'warn',
			'import-x/export': 'warn',
			'import-x/no-unresolved': 'warn',
		},
	},
	{
		rules: {
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-empty-interface': 'warn',
			'@typescript-eslint/no-unsafe-declaration-merging': 'warn',
			'@typescript-eslint/no-require-imports': 'warn',
			'@typescript-eslint/no-this-alias': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/require-await': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/unbound-method': 'warn',
			'@typescript-eslint/restrict-template-expressions': 'warn',
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
			'@typescript-eslint/await-thenable': 'warn',
			'@typescript-eslint/no-misused-promises': 'warn',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/prefer-promise-reject-errors': 'warn',
			'@typescript-eslint/no-redundant-type-constituents': 'warn',
			'@typescript-eslint/restrict-plus-operands': 'warn',
			'@typescript-eslint/no-implied-eval': 'warn',
			'@typescript-eslint/no-duplicate-type-constituents': 'warn',
			'@typescript-eslint/no-unsafe-enum-comparison': 'warn',
			'@typescript-eslint/only-throw-error': 'warn',
			'@typescript-eslint/no-base-to-string': 'warn',
			'@typescript-eslint/no-for-in-array': 'warn',
			'@typescript-eslint/no-array-delete': 'warn',
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
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	{
		ignores: ['**/dist/**', '**/public/**', '**/.meteor/**'],
	},
	{
		files: [
			'babel.config.js',
			'webpack.config.js',
			'eslint.config.mjs',
			'.prettierrc.js',
			'**/scripts/**/*.js',
			'**/scripts/**/*.mjs',
			'**/*.mock.js',
			'*.js',
			'**/*.js',
		],
		languageOptions: {
			globals: globals.node,
		},
		extends: [tseslint.configs.disableTypeChecked],
	},
	{
		files: [
			'**/*.spec.ts',
			'**/*.test.ts',
			'jest.config.ts',
			'**/*.js',
			'**/*.mjs',
			'**/tests/**',
			'**/__tests__/**',
			'**/__mocks__/**',
			'**/__examples__/**',
			'**/.storybook/**',
		],
		extends: [tseslint.configs.disableTypeChecked],
	},
);
