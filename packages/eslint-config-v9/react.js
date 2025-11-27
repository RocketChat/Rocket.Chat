import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'jsx-a11y': jsxA11yPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...(jsxA11yPlugin.configs?.recommended?.rules || {}),
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react/display-name': 'error',
			'react/jsx-curly-brace-presence': 'error',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-undef': 'error',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-multi-comp': 'error',
			'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
		},
	},
	{
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
];

