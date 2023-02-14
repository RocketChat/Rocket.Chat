module.exports = {
	extends: ['../original/index.js', 'plugin:prettier/recommended', 'plugin:import/typescript'],
	parser: '@babel/eslint-parser',
	parserOptions: {
		requireConfigFile: false,
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.ts', '.tsx'],
			},
		},
	},
	rules: {
		'jsx-quotes': ['error', 'prefer-single'],
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/eslint-recommended',
				'../original/index.js',
				'plugin:prettier/recommended',
			],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2018,
				warnOnUnsupportedTypeScriptVersion: false,
				ecmaFeatures: {
					experimentalObjectRestSpread: true,
					legacyDecorators: true,
				},
			},
			plugins: ['@typescript-eslint', 'anti-trojan-source'],
			rules: {
				'@typescript-eslint/ban-types': 'warn',
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
				'indent': 'off',
				'jsx-quotes': ['error', 'prefer-single'],
				'no-dupe-class-members': 'off',
				'no-empty-function': 'off',
				'no-redeclare': 'off',
				'no-spaced-func': 'off',
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'no-use-before-define': 'off',
				'no-useless-constructor': 'off',
			},
			env: {
				browser: true,
				commonjs: true,
				es6: true,
				node: true,
			},
			settings: {
				'import/resolver': {
					node: {
						extensions: ['.js', '.ts', '.tsx'],
					},
				},
			},
		},
		{
			files: ['**/*.d.ts'],
			rules: {
				'@typescript-eslint/naming-convention': 'off',
			},
		},
	],
};
