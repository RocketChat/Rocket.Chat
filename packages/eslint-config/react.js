// @ts-check

import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
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
			'react-hooks/exhaustive-deps': 'warn',
			'react-hooks/rules-of-hooks': 'warn',
			'react/display-name': 'warn',

			'react/jsx-curly-brace-presence': 'warn',
			'react/jsx-fragments': ['warn', 'syntax'],
			'react/jsx-key': ['warn', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
			'react/jsx-no-undef': 'warn',
			'react/jsx-uses-react': 'warn',
			'react/jsx-uses-vars': 'warn',
			'react/no-multi-comp': 'warn',
			'jsx-a11y/no-autofocus': [2, { ignoreNonDOM: true }],
			'@typescript-eslint/naming-convention': 'warn',
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		languageOptions: {
			globals: globals.browser,
		},
	},
	{
		files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx', '**/*.spec.tsx'],
		plugins: {
			'testing-library': testingLibrary,
		},
		rules: {
			'react/display-name': 'warn',
			'react/no-multi-comp': 'warn',
		},
	},
);
