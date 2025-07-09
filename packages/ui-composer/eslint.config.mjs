// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/no-unescaped-entities': 'warn',
		},
	}),
	{
		rules: {
			'import-x/order': 'off',
		},
	},
);
