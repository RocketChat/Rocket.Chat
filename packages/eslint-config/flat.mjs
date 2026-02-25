import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import antiTrojanSourcePlugin from 'eslint-plugin-anti-trojan-source';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	// linting options
	{
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},
	// ignored directories
	{
		ignores: ['**/dist', '**/coverage'],
	},
	importPlugin.flatConfigs.recommended,
	importPlugin.flatConfigs.typescript,
	jsxA11yPlugin.flatConfigs.recommended,
	{
		rules: {
			'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
		},
	},
	{
		plugins: {
			react: reactPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/display-name': 'error',
			'react/jsx-curly-brace-presence': 'error',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-undef': 'error',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-children-prop': 'error',
			'react/no-multi-comp': 'error',
		},
	},
	{
		plugins: {
			'react-hooks': reactHooksPlugin,
		},
		rules: {
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
		},
	},
	...storybookPlugin.configs['flat/recommended'],
	{
		plugins: {
			'anti-trojan-source': antiTrojanSourcePlugin,
		},
		rules: {
			'anti-trojan-source/no-bidi': 'error',
		},
	},
	prettierPluginRecommended,
	// javascript files
	{
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	},
	// typescript files
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				warnOnUnsupportedTypeScriptVersion: false,
			},
		},
		plugins: {
			'@typescript-eslint': typescriptPlugin,
		},
	},
	// best practices
	{
		rules: {
			'array-callback-return': ['error', { allowImplicit: true }],
			'block-scoped-var': 'error',
			'complexity': ['warn', 31],
			'dot-notation': ['error', { allowKeywords: true }],
			'eqeqeq': ['error', 'allow-null'],
			'guard-for-in': 'error',
			'no-caller': 'error',
			'no-div-regex': 'off',
			'no-else-return': ['error', { allowElseIf: false }],
			'no-empty-function': [
				'error',
				{
					allow: ['arrowFunctions', 'functions', 'methods'],
				},
			],
			'no-empty-pattern': 'error',
			'no-eval': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-extra-label': 'error',
			'no-fallthrough': 'error',
			'no-implied-eval': 'error',
			'no-invalid-this': 'off',
			'no-iterator': 'error',
			'no-lone-blocks': 'error',
			'no-loop-func': 'error',
			'no-multi-str': 'error',
			'no-new-wrappers': 'error',
			'no-octal': 'error',
			'no-proto': 'error',
			'no-redeclare': 'error',
			'no-restricted-properties': [
				'error',
				{
					object: 'describe',
					property: 'only',
				},
				{
					object: 'it',
					property: 'only',
				},
				{
					object: 'context',
					property: 'only',
				},
			],
			'no-return-assign': ['error', 'always'],
			'no-return-await': 'error',
			'no-self-compare': 'error',
			'no-sequences': 'error',
			'no-throw-literal': 'error',
			'no-unused-labels': 'error',
			'no-useless-call': 'off',
			'no-useless-concat': 'error',
			'no-useless-return': 'error',
			'no-void': 'off',
			'yoda': 'error',
		},
	},
	// prevent common mistakes
	{
		rules: {
			'for-direction': 'error',
			'getter-return': ['error', { allowImplicit: true }],
			// TODO: enable, semver-major
			'no-async-promise-executor': 'off',
			'no-await-in-loop': 'error',
			'no-compare-neg-zero': 'error',
			'no-cond-assign': 'error',
			'no-constant-condition': 'error',
			'no-control-regex': 'error',
			'no-debugger': 'error',
			'no-dupe-args': 'error',
			'no-dupe-keys': 'error',
			'no-duplicate-case': 'error',
			'no-empty': 'error',
			'no-empty-character-class': 'error',
			'no-ex-assign': 'error',
			'no-extra-boolean-cast': 'error',
			'no-func-assign': 'error',
			'no-inner-declarations': ['error', 'functions'],
			'no-invalid-regexp': 'error',
			'no-irregular-whitespace': 'error',
			'no-obj-calls': 'error',
			'no-regex-spaces': 'error',
			'no-sparse-arrays': 'error',
			'no-unreachable': 'error',
			'no-unsafe-finally': 'error',
			'no-unsafe-negation': 'error',
			'no-negated-in-lhs': 'error',
			'require-atomic-updates': 'off',
			'use-isnan': 'error',
			'valid-typeof': ['error', { requireStringLiterals: true }],
		},
	},
	// Node.js and CommonJS globals
	// TODO: disable, as they are not available in all environments
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	// stylistic issues
	{
		rules: {
			'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false }],
			'lines-around-directive': [
				'error',
				{
					before: 'always',
					after: 'always',
				},
			],
			'max-depth': ['off', 4],
			'new-cap': 'error',
			'no-array-constructor': 'error',
			'no-lonely-if': 'error',
			'no-multi-assign': 'error',
			'no-nested-ternary': 'error',
			'no-unneeded-ternary': ['error', { defaultAssignment: false }],
			'one-var': ['error', 'never'],
			'operator-assignment': ['error', 'always'],
			'prefer-object-spread': 'off',
			'spaced-comment': 'error',
		},
	},
	// variables related rules
	{
		rules: {
			'no-delete-var': 'error',
			'no-undef': 'error',
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
				},
			],
			'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
		},
	},
	// ES2015 related rules
	{
		rules: {
			'no-const-assign': 'error',
			'no-dupe-class-members': 'error',
			'no-duplicate-imports': 'off',
			'no-this-before-super': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-constructor': 'error',
			'no-useless-rename': [
				'error',
				{
					ignoreDestructuring: false,
					ignoreImport: false,
					ignoreExport: false,
				},
			],
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-const': [
				'error',
				{
					destructuring: 'any',
					ignoreReadBeforeAssign: true,
				},
			],
			'prefer-destructuring': [
				'error',
				{
					VariableDeclarator: {
						array: false,
						object: true,
					},
					AssignmentExpression: {
						array: false,
						object: false,
					},
				},
				{
					enforceForRenamedProperties: false,
				},
			],
			'prefer-rest-params': 'error',
			'prefer-template': 'error',
		},
	},
	// import related rules
	{
		settings: {
			'import/resolver': {
				node: true,
				typescript: true,
			},
			'import/ignore': ['meteor/.+'],
		},
		rules: {
			'import/no-unresolved': [
				'error',
				{
					commonjs: true,
					caseSensitive: true,
				},
			],
			'import/named': 'off',
			'import/default': 'off',
			'import/namespace': 'off',
			'import/export': 'error',
			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',
			'import/first': 'error',
			'import/no-duplicates': 'error',
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					'groups': ['builtin', ['external', 'internal'], ['parent', 'sibling', 'index']],
					'alphabetize': {
						order: 'asc',
					},
				},
			],
			'import/newline-after-import': 'error',
			'import/no-absolute-path': 'error',
			'import/no-dynamic-require': 'error',
			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
			'import/no-useless-path-segments': 'error',
		},
	},
	{
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		rules: {
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
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/no-empty-interface': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-redeclare': 'error',
			'@typescript-eslint/no-redundant-type-constituents': 'off',
			'@typescript-eslint/no-this-alias': 'error',
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
			'no-dupe-class-members': 'off',
			'no-empty-function': 'off',
			'no-redeclare': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-constructor': 'off',
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
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
