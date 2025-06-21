// @ts-check

import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { config as baseConfig } from './base.js';

/**
 * A shared ESLint configuration for the repository
 */
export const config = tseslint.config(
	baseConfig,
	{
		plugins: {
			'jsx-a11y': jsxA11y,
			'react': react,
			'react-hooks': reactHooks,
		},
		rules: {
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react/display-name': 'off',

			'react/jsx-curly-brace-presence': 'off',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-key': ['error', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-undef': 'error',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/no-multi-comp': 'error',
			'jsx-a11y/no-autofocus': [2, { ignoreNonDOM: true }],
			'@typescript-eslint/naming-convention': 'off'
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		rules: {
			'react/display-name': 'off',
			'react/no-multi-comp': 'off',
		},
	},
);
