import react from '@rocket.chat/eslint-config-v9/react.js';
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
	...standard,
	...react,
	prettierConfig,
	{
		ignores: ['**/build/**', '**/dist/**', '**/node_modules/**', '**/.storybook/**', 'src/i18next.js'],
	},
	{
		plugins: {
			prettier: prettierPlugin,
		},
		rules: {
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
			'react/display-name': ['warn', { ignoreTranspilerName: false }],
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-no-bind': [
				'warn',
				{
					ignoreRefs: true,
					allowFunctions: true,
					allowArrowFunctions: true,
				},
			],
			'react/jsx-no-comment-textnodes': 'error',
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-target-blank': 'error',
			'react/jsx-no-undef': 'error',
			'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always' }],
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-danger': 'warn',
			'react/no-deprecated': 'error',
			'react/no-did-mount-set-state': 'error',
			'react/no-did-update-set-state': 'error',
			'react/no-find-dom-node': 'error',
			'react/no-is-mounted': 'error',
			'react/no-string-refs': 'error',
			'react/prefer-es6-class': 'error',
			'react/prefer-stateless-function': 'warn',
			'react/require-render-return': 'error',
			'react/self-closing-comp': 'error',
			'react/no-multi-comp': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'no-sequences': 'off',
			'no-extra-parens': 'off',
			'prettier/prettier': 2,
			'jsx-a11y/iframe-has-title': 'warn',
			'jsx-a11y/no-static-element-interactions': 'warn',
			'jsx-a11y/media-has-caption': 'warn',
			'jsx-a11y/alt-text': 'warn',
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.ts', '.tsx'],
				},
			},
			'react': {
				pragma: 'h',
				pragmaFrag: 'Fragment',
				version: 'detect',
			},
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
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
			],
		},
	},
	{
		files: ['**/*.spec.js', '**/*.spec.jsx', '**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.spec.ts'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['**/*.stories.tsx', '**/*.stories.ts', '**/*.stories.js', '**/*.stories.jsx'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
];
