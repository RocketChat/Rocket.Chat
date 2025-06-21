import { config } from '@rocket.chat/eslint-config/base';
import pluginJest from 'eslint-plugin-jest';
export default [
	...config,
	{
		files: ['**/*.spec.js', '**/*.spec.mjs', '**/*.spec.jsx'],
		plugins: { jest: pluginJest },
		languageOptions: {
			globals: pluginJest.environments.globals.globals,
		},
	},
];
