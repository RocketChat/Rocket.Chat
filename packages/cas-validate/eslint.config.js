import standard from '@rocket.chat/eslint-config-v9/standard/index.js';
import globals from 'globals';

export default [
	...standard,
	{
		ignores: ['**/dist'],
	},
	{
		files: ['**/*.spec.js', '**/*.spec.jsx', '**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.spec.ts'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
];

