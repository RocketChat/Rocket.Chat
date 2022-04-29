module.exports = {
	root: true,
	extends: ['@rocket.chat/eslint-config/original', 'prettier'],
	parser: 'babel-eslint',
	plugins: ['react', 'react-hooks', 'prettier', 'testing-library', 'anti-trojan-source'],
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
		'new-cap': ['error', { capIsNewExceptions: ['HTML.Comment', 'HTML.Raw', 'HTML.DIV', 'SHA256'] }],
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
		'anti-trojan-source/no-bidi': 'error',
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
				'@rocket.chat/eslint-config/original',
				'prettier',
			],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
			rules: {
				'@typescript-eslint/ban-ts-ignore': 'off',
				'@typescript-eslint/explicit-function-return-type': 'warn',
				// '@typescript-eslint/explicit-module-boundary-types': 'off',
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
				'@typescript-eslint/prefer-optional-chain': 'warn',
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
				'new-cap': ['error', { capIsNewExceptions: ['HTML.Comment', 'HTML.Raw', 'HTML.DIV', 'SHA256'] }],
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
				'anti-trojan-source/no-bidi': 'error',
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
		{
			files: ['**/*.tests.js', '**/*.tests.ts', '**/*.spec.ts', '**/*.spec.tsx'],
			extends: ['plugin:testing-library/react'],
			rules: {
				'testing-library/no-await-sync-events': 'warn',
				'testing-library/no-manual-cleanup': 'warn',
				'testing-library/prefer-explicit-assert': 'warn',
				'testing-library/prefer-user-event': 'warn',
			},
			env: {
				mocha: true,
			},
		},
		{
			files: ['**/*.stories.ts', '**/*.stories.tsx'],
			rules: {
				'@typescript-eslint/explicit-function-return-type': 'off',
				'@typescript-eslint/explicit-module-boundary-types': 'off',
			},
		},
	],
};
