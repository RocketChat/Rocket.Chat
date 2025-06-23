// @ts-check

import tseslint from 'typescript-eslint';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * A shared ESLint configuration for the repository
 */
export const config = tseslint.config([
	...baseConfig,
	{
		files: ['**/*.js', '**/*.cjs'],
		rules: {
			'@typescript-eslint/no-require-imports': 'warn',
		},
		languageOptions: {
			globals: globals.node,
		},
	},
]);
