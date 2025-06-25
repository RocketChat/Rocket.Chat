import { config as base } from '@rocket.chat/eslint-config/base';
import { config as jest } from '@rocket.chat/eslint-config/jest';
import { config as mocha } from '@rocket.chat/eslint-config/mocha';
import { config as react } from '@rocket.chat/eslint-config/react';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
	[
		...base,
		{
			ignores: ['packages/**/*', 'definition/**/*', '.scripts/**/*', 'imports/client/**/*'],
		},
	],
	jest,
	mocha,
	react,
	{
		files: ['server/**/*', 'app/*/server/**/*', 'app/*/lib/**/*'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.meteor,
				__meteor_runtime_config__: 'readonly',
			},
			parserOptions: {
				projectService: true,
			},
		},
	},
);
