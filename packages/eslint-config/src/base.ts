import eslint from '@eslint/js';
import tseslint, { type InfiniteDepthConfigWithExtends } from 'typescript-eslint';
import globals from 'globals';
import { importX } from 'eslint-plugin-import-x';
import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import { ignore } from './config/ignore.js';

import javascript from './rules/javascript.js';
import security from './security.js';
import prettier from './prettier.js';

export default async function base(
	...configs: (Promise<InfiniteDepthConfigWithExtends> | InfiniteDepthConfigWithExtends)[]
): Promise<FlatConfig.ConfigArray> {
	const resolvedConfigs = await Promise.all(configs);
	return tseslint.config(
		ignore([
			'**/scripts/**',
			'**/dist/**',
			'**/public/**',
			'**/.meteor/**',
			'.mocha.api.js',
			'.mocharc.js',
			'.mocharc.*.js',
			'**/.storybook/**',
			'babel.config.js',
			'eslint.config.mjs',
			'jest.config.ts',
			'webpack.config.js',
			'.prettierrc.js',
			'**/coverage/**',
		]),
		eslint.configs.recommended,
		{
			rules: javascript.recommended,
		},
		importX.flatConfigs.recommended,
		importX.flatConfigs.typescript,
		tseslint.configs.recommendedTypeChecked,
		prettier(),
		security({ rules: { 'security/detect-object-injection': 'off' } }),
		{
			rules: {
				'prefer-const': 'warn',
			},
		},
		{
			rules: {
				'import-x/namespace': 'warn',
				'import-x/export': 'warn',
				'import-x/no-unresolved': 'warn',
				'import-x/default': 'warn',
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
				'@typescript-eslint/no-non-null-assertion': 'warn',
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
					{
						selector: 'variable',
						modifiers: ['destructured'],
						format: null,
					},
					{
						selector: 'parameter',
						modifiers: ['destructured'],
						format: null,
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
		},
		{
			languageOptions: {
				globals: globals.node,
				parserOptions: {
					projectService: true,
				},
			},
		},
		...resolvedConfigs,
		{
			files: [
				'**/*.spec.ts',
				'**/__tests__/**/*.ts',
				'**/*.test.ts',
				'**/tests/**/*.ts',
				'**/__mocks__/**/*.ts',
				'**/__examples__/**/*.ts',
			],
			extends: [tseslint.configs.disableTypeChecked],
		},
	);
}
