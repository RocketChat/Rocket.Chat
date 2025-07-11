// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/no-children-prop': 'warn',
		},
	}),
	{
		rules: {
			'import-x/order': 'off',
			'react-refresh/only-export-components': 'warn',
		},
	},
);
