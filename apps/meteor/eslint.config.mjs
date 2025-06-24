import { config as base } from '@rocket.chat/eslint-config/base';
import { config as jest } from '@rocket.chat/eslint-config/jest';
import { config as mocha } from '@rocket.chat/eslint-config/mocha';
import { config as node } from '@rocket.chat/eslint-config/node';
import { config as react } from '@rocket.chat/eslint-config/react';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
	[
		...base,
		{
			ignores: ['packages/**/*', 'definition/**/*'],
		},
	],
	jest,
	mocha,
	react,
	[
		node,
		{
			files: ['server/**/*', 'app/*/server/**/*'],
			languageOptions: {
				globals: {
					...globals.node,
					...globals.meteor,
					__meteor_runtime_config__: 'readonly',
				},
			},
		},
	],
);
