// @ts-check

import { config } from '@rocket.chat/eslint-config/base';
import tseslint from 'typescript-eslint';

export default tseslint.config([
	{
		ignores: ['client/**/*', 'server/**/*', 'definition/**/*', 'lib/**/*', 'deno-runtime/**/*', '.deno-cache/**/*'],
	},
	...config,
	{
		rules: {
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: ['function', 'parameter', 'variable'],
					modifiers: ['destructured'],
					format: null,
				},
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
					selector: ['parameter'],
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
				{
					selector: ['parameter'],
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'allow',
				},
				{
					selector: ['interface'],
					format: ['PascalCase'],
					custom: {
						regex: '^I[A-Z]',
						match: true,
					},
				},
			],
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-require-imports': 'warn',
			'no-await-in-loop': 'warn',
			'prefer-const': 'warn',
		},
	},
]);
