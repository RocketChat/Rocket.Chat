import react from '@rocket.chat/eslint-config-v9/react.js';
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	...react,
	{
		ignores: ['dist', '!.storybook'],
	},
	{
		files: ['**/*.stories.tsx'],
		rules: {
			'react/no-multi-comp': 'off',
		},
	},
];
