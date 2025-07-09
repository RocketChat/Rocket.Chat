import tseslint from 'typescript-eslint';
import globals from 'globals';

import typescript from './configs/typescript.js';
import security from './configs/security.js';
import importX from './configs/import-x.js';
import javascript from './configs/javascript.js';
import stylistic from './configs/stylistic.js';

export default async function base(
	...configs: (Promise<tseslint.InfiniteDepthConfigWithExtends> | tseslint.InfiniteDepthConfigWithExtends)[]
) {
	const resolvedConfigs = await Promise.all(configs);
	const resultConfigs = tseslint.config(
		{
			name: 'base',
		},
		{
			ignores: [
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
			],
		},
		security({ rules: { 'security/detect-object-injection': 'off' } }),
		javascript({
			rules: {
				'prefer-const': 'warn',
				'no-redeclare': 'off',
				'no-unused-vars': 'off',
				'no-useless-escape': 'warn',
				'no-useless-catch': 'warn',
				'no-prototype-builtins': 'warn',
			},
		}),
		stylistic({
			rules: {
				'@stylistic/semi': 'off',
				'@stylistic/no-tabs': 'off',
				'@stylistic/indent': 'off',
				'@stylistic/indent-binary-ops': 'off',
				'@stylistic/brace-style': 'off',
				'@stylistic/member-delimiter-style': ['error', { multiline: { delimiter: 'semi' } }],
				'@stylistic/arrow-parens': ['error', 'always', { requireForBlockBody: true }],
				'@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|': 'before' } }],
				'@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
				'@stylistic/quote-props': 'off',
				'@stylistic/spaced-comment': ['error', 'always', { block: { balanced: false } }],
				'@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
				'@stylistic/jsx-quotes': ['error', 'prefer-single'],
				'@stylistic/jsx-indent-props': ['error', 'tab'],
				'@stylistic/jsx-one-expression-per-line': 'off',
				'@stylistic/jsx-wrap-multilines': ['error', { arrow: 'ignore' }],
				'@stylistic/multiline-ternary': 'off',
				'@stylistic/jsx-closing-tag-location': 'off',
				'@stylistic/jsx-curly-newline': 'off',
				'@stylistic/jsx-curly-brace-presence': 'off',
			},
		}),
		importX(),
		typescript({
			rules: {
				'@typescript-eslint/ban-ts-comment': 'warn',
				'@typescript-eslint/no-explicit-any': 'warn',
				'@typescript-eslint/no-empty-object-type': 'warn',
				'@typescript-eslint/no-empty-interface': 'off',
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
		}),
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

	return resultConfigs;
}
