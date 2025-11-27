import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	{
		ignores: [
			'**/client/**',
			'**/definition/**',
			'**/deno-runtime/**',
			'**/lib/**',
			'**/scripts/**',
			'**/server/**',
			'**/docs/**',
			'**/.deno/**',
			'**/.deno-cache/**',
			'**/node_modules/**',
			'!/gulpfile.js',
		],
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig-lint.json',
			},
		},
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
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
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'new-cap': 'off',
			'no-await-in-loop': 'off',
		},
	},
];

