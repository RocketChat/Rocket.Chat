import { config } from '@rocket.chat/eslint-config/base';
import pluginJest from 'eslint-plugin-jest';
export default [
	...config,
	{
		rules: {
			'no-useless-escape': 'off',
		},
	},
	{
		files: ['**/*.spec.js', '**/*.spec.jsx'],
		plugins: { jest: pluginJest },
		languageOptions: {
			globals: pluginJest.environments.globals.globals,
		},
	},
];
