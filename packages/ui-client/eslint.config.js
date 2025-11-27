import react from '@rocket.chat/eslint-config-v9/react.js';
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	...react,
	{
		ignores: ['**/dist', '!.storybook'],
	},
	{
		files: ['**/*.stories.tsx', '**/*.stories.ts'],
		rules: {
			'react-hooks/rules-of-hooks': 'off',
		},
	},
	{
		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
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
					format: null,
					filter: {
						regex: '^(Component|FocusScope|Story)$',
						match: true,
					},
				},
				{
					selector: 'parameter',
					format: ['camelCase'],
					modifiers: ['unused'],
					leadingUnderscore: 'require',
				},
				{
					selector: 'interface',
					format: ['PascalCase'],
					filter: {
						regex: 'Props$',
						match: true,
					},
				},
			],
		},
	},
];

