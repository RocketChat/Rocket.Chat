// @ts-check

import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import { config as base } from './base.js';

/**
 * A shared ESLint configuration for the repository
 *
 * @param {import('typescript-eslint').ConfigWithExtends} [config={}] - Additional configuration options to extend the base config.
 * @return {import('typescript-eslint').ConfigArray} The complete ESLint configuration.
 */
export function defineConfig(config = {}) {
	return tseslint.config(
		...base,
		react.configs.flat.recommended,
		react.configs.flat['jsx-runtime'],
		{
			rules: {
				'react/no-unescaped-entities': 'warn',
				'react/no-children-prop': 'warn',
				'react/prop-types': 'warn',
				'react/display-name': 'warn',
				'react/jsx-curly-brace-presence': 'warn',
				'react/jsx-fragments': ['warn', 'syntax'],
				'react/jsx-key': ['warn', { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
				'react/jsx-no-undef': 'warn',
				'react/jsx-uses-vars': 'warn',
				'react/jsx-no-target-blank': 'warn',
				'react/no-multi-comp': 'warn',
				'react/no-direct-mutation-state': 'warn',
				'react/no-unknown-property': 'warn',
			},
		},
		reactHooks.configs['recommended-latest'],
		{
			rules: {
				'react-hooks/exhaustive-deps': 'warn',
				'react-hooks/rules-of-hooks': 'warn',
			},
		},
		reactRefresh.configs.recommended,
		{
			rules: {
				'react-refresh/only-export-components': 'warn',
			},
		},
		storybook.configs['flat/recommended'],
		{
			rules: {
				'storybook/no-renderer-packages': 'warn',
			},
		},
		jsxA11y.flatConfigs.recommended,
		{
			rules: {
				'jsx-a11y/click-events-have-key-events': 'warn',
				'jsx-a11y/no-static-element-interactions': 'warn',
				'jsx-a11y/no-autofocus': 'warn',
				'jsx-a11y/media-has-caption': 'warn',
				'jsx-a11y/iframe-has-title': 'warn',
				'jsx-a11y/alt-text': 'warn',
			},
			settings: {
				react: {
					version: 'detect',
				},
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
		{
			languageOptions: {
				globals: globals.browser,
				...config.languageOptions,
			},
		},
	);
}

export const config = defineConfig();
