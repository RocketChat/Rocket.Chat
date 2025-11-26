import original from '../original/index.js';
import react from '../react.js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import babelParser from '@babel/eslint-parser';
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	...original,
	...react,
	prettierConfig,
	{
		plugins: {
			prettier: prettierPlugin,
			import: importPlugin,
		},
		languageOptions: {
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
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
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		languageOptions: {
			parser: tseslint.parser,
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
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			'anti-trojan-source': antiTrojanSourcePlugin,
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.ts', '.tsx', '.cts', '.mts'],
				},
				typescript: {},
			},
		},
		rules: {
			'@typescript-eslint/ban-types': [
				'warn',
				{
					types: {
						FC: 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.FC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						VFC: 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						'React.VFC': 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
						FunctionComponent: 'Useless and has some drawbacks, see https://adr.rocket.chat/0094',
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
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/prefer-optional-chain': 'warn',
			'anti-trojan-source/no-bidi': 'error',
			'func-call-spacing': 'off',
			indent: 'off',
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
	},
	{
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
		},
	},
];

