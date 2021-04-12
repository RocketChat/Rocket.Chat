module.exports = {
	root: true,
	extends: ['@rocket.chat/eslint-config', 'prettier'],
	parser: 'babel-eslint',
	plugins: ['react', 'react-hooks', 'prettier'],
	rules: {
		'import/named': 'error',
		'import/order': [
			'error',
			{
				'newlines-between': 'always',
				'groups': ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
				'alphabetize': {
					order: 'asc',
				},
			},
		],
		'jsx-quotes': ['error', 'prefer-single'],
		'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
		'prettier/prettier': 2,
		'react/display-name': 'error',
		'react/jsx-uses-react': 'error',
		'react/jsx-uses-vars': 'error',
		'react/jsx-no-undef': 'error',
		'react/jsx-fragments': ['error', 'syntax'],
		'react/no-multi-comp': 'error',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': [
			'warn',
			{
				additionalHooks: '(useComponentDidUpdate)',
			},
		],
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.ts', '.tsx'],
			},
		},
		'react': {
			version: 'detect',
		},
	},
	env: {
		browser: true,
		es6: true,
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/eslint-recommended',
				'@rocket.chat/eslint-config',
				'prettier',
			],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
			rules: {
				'@typescript-eslint/ban-ts-ignore': 'off',
				'@typescript-eslint/indent': 'off',
				'@typescript-eslint/interface-name-prefix': ['error', 'always'],
				'@typescript-eslint/no-extra-parens': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						argsIgnorePattern: '^_',
					},
				],
				'func-call-spacing': 'off',
				'indent': 'off',
				'import/order': [
					'error',
					{
						'newlines-between': 'always',
						'groups': ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
						'alphabetize': {
							order: 'asc',
						},
					},
				],
				'jsx-quotes': ['error', 'prefer-single'],
				'no-extra-parens': 'off',
				'no-spaced-func': 'off',
				'no-unused-vars': 'off',
				'no-useless-constructor': 'off',
				'no-use-before-define': 'off',
				'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
				'prettier/prettier': 2,
				'react/display-name': 'error',
				'react/jsx-uses-react': 'error',
				'react/jsx-uses-vars': 'error',
				'react/jsx-no-undef': 'error',
				'react/jsx-fragments': ['error', 'syntax'],
				'react/no-multi-comp': 'error',
				'react-hooks/rules-of-hooks': 'error',
				'react-hooks/exhaustive-deps': [
					'warn',
					{
						additionalHooks: '(useComponentDidUpdate)',
					},
				],
			},
			env: {
				browser: true,
				es6: true,
			},
			settings: {
				'import/resolver': {
					node: {
						extensions: ['.js', '.ts', '.tsx'],
					},
				},
				'react': {
					version: 'detect',
				},
			},
		},
		{
			files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx'],
			rules: {
				'react/display-name': 'off',
				'react/no-multi-comp': 'off',
			},
		},
	],
};
