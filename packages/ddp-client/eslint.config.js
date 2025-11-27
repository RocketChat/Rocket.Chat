import standard from '@rocket.chat/eslint-config-v9/standard/index.js';
import globals from 'globals';

export default [
	...standard,
	{
		ignores: ['**/dist', '**/coverage'],
	},
	{
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'variableLike', format: ['camelCase'], leadingUnderscore: 'allow' },
				{
					selector: ['variable'],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'parameter',
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
				},
			],
		},
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

