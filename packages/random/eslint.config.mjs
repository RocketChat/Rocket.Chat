import { config } from '@rocket.chat/eslint-config/base';
import pluginJest from 'eslint-plugin-jest';
export default [
	...config,
	{
		files: ['**/*.spec.ts', '**/*.spec.tsx'],
		plugins: { jest: pluginJest },
		languageOptions: {
			globals: pluginJest.environments.globals.globals,
		},
	},
];
