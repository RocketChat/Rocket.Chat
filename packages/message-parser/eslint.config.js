import react from '@rocket.chat/eslint-config-v9/react.js';
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	...react,
	{
		ignores: ['**/dist', '.prettierrc.js', 'loaders/**', 'messageParser.js'],
	},
	{
		files: ['.prettierrc.js'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
];

