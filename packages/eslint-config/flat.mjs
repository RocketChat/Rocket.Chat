import babelParser from '@babel/eslint-parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
// eslint-disable-next-line import/no-unresolved
// import tseslint from 'typescript-eslint';

import bestPractices from './best-practices.mjs';
import errors from './errors.mjs';
import es6 from './es6.mjs';
import imports from './imports.mjs';
import node from './node.mjs';
import style from './style.mjs';
import variables from './variables.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	{
		ignores: ['**/dist'],
	},
	bestPractices,
	errors,
	node,
	style,
	variables,
	es6,
	imports,
	{
		languageOptions: {
			ecmaVersion: 2018,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.commonjs,
				...globals.es6,
				...globals.node,
			},
		},
	},
	jsxA11yPlugin.flatConfigs.recommended,
	{
		plugins: {
			'react': reactPlugin,
			'react-hooks': reactHooksPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react/display-name': 'error',
			'react/jsx-curly-brace-presence': 'error',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-undef': 'error',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-children-prop': 'error',
			'react/no-multi-comp': 'error',
			'jsx-a11y/no-autofocus': [2, { ignoreNonDOM: true }],
		},
	},
	{
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
	eslintPluginPrettierRecommended,
	importPlugin.flatConfigs.typescript,
	{
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
			},
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.ts', '.tsx', '.cts', '.mts'],
				},
			},
		},
		rules: {
			'jsx-quotes': ['error', 'prefer-single'],
		},
	},
	// ...tseslint.configs.recommended,
	// tseslint.configs.eslintRecommended,
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2018,
				warnOnUnsupportedTypeScriptVersion: false,
				ecmaFeatures: {
					experimentalObjectRestSpread: true,
					legacyDecorators: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.commonjs,
				...globals.es6,
				...globals.node,
			},
		},
		plugins: {
			'anti-trojan-source': antiTrojanSourcePlugin,
			'@typescript-eslint': typescriptPlugin,
		},
		rules: {
			// '@typescript-eslint/no-empty-object-type': 'warn',
			// '@typescript-eslint/no-restricted-types': [
			'@typescript-eslint/ban-types': [
				'warn',
				{
					types: {
						'FC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.FC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'VFC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.VFC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'FunctionComponent': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.FunctionComponent': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
					},
				},
			],
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/consistent-type-imports': 'error',
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
					format: null,
					filter: {
						regex: '^Story$',
						match: true,
					},
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
			'@typescript-eslint/no-dupe-class-members': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-redeclare': 'error',
			'@typescript-eslint/no-redundant-type-constituents': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/prefer-optional-chain': 'warn',
			'@typescript-eslint/require-await': 'off',
			'anti-trojan-source/no-bidi': 'error',
			'func-call-spacing': 'off',
			'indent': 'off',
			'jsx-quotes': ['error', 'prefer-single'],
			'no-dupe-class-members': 'off',
			'no-empty-function': 'off',
			'no-extra-parens': 'off',
			'no-redeclare': 'off',
			'no-spaced-func': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-constructor': 'off',
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.ts', '.tsx', '.cts', '.mts'],
				},
				typescript: {},
			},
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		ignores: [
			'**/*.d.ts',
			'**/__tests__/**',
			'**/*.spec.ts',
			'**/*.spec.tsx',
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/tests/**',
			'**/.storybook/**',
			'**/jest.config.ts',
			'**/jest.config.js',
			'**/jest.config.*.ts',
			'**/jest.config.*.js',
			'**/webpack.config.ts',
			'**/webpack.config.js',
			'**/vite.config.ts',
			'**/vite.config.js',
			'**/rollup.config.ts',
			'**/rollup.config.js',
		],
		languageOptions: {
			parserOptions: {
				project: true,
			},
		},
		rules: {
			'@typescript-eslint/no-misused-promises': [
				'error',
				{
					checksVoidReturn: {
						arguments: false,
					},
				},
			],
			'@typescript-eslint/no-floating-promises': 'error',
		},
	},
	{
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
		},
	},
];
