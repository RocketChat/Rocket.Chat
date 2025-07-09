// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/prop-types': 'warn',
			'react/no-children-prop': 'warn',
			'react/display-name': 'warn',
			'react/jsx-no-target-blank': 'warn',
		},
	}),
	{
		rules: {
			'import-x/export': 'off',
			'import-x/order': 'off',
			'no-prototype-builtins': 'off',
		},
	},
);
