import react from '@rocket.chat/eslint-config-v9/react.js';
import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	...react,
	{
		ignores: ['dist', 'node_modules'],
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
];

