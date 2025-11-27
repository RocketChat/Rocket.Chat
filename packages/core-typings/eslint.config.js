import standard from '@rocket.chat/eslint-config-v9/standard/index.js';

export default [
	...standard,
	{
		ignores: ['**/dist'],
	},
	{
		rules: {
			'@typescript-eslint/no-empty-interface': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
];

