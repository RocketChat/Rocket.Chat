module.exports = {
	extends: ['../original/index.js', 'plugin:prettier/recommended', 'plugin:import/typescript'],
	parser: 'babel-eslint',
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
				'func-call-spacing': 'off',
				'jsx-quotes': ['error', 'prefer-single'],
				'indent': 'off',
				'no-dupe-class-members': 'off',
				'no-spaced-func': 'off',
				'no-unused-vars': 'off',
				'no-useless-constructor': 'off',
				'no-use-before-define': 'off',
				'@typescript-eslint/ban-ts-ignore': 'off',
				'@typescript-eslint/interface-name-prefix': ['error', 'always'],
				// The following config should successfully replace @typescript-eslint/interface-name-prefix as it is deprecated on newer versions
				// '@typescript-eslint/naming-convention': [
				// 	'error',
				// 	{
				// 		selector: 'interface',
				// 		format: ['PascalCase'],
				// 		custom: {
				// 			regex: '^I[A-Z]',
				// 			match: true,
				// 		},
				// 	},
				// ],
				'@typescript-eslint/no-dupe-class-members': 'error',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						argsIgnorePattern: '^_',
						ignoreRestSiblings: true,
					},
				],
				'@typescript-eslint/prefer-optional-chain': 'warn',
				'anti-trojan-source/no-bidi': 'error',
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
	],
};
