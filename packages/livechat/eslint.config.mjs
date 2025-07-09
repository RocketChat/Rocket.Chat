// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/jsx-key': 'warn',
			'react/prop-types': 'warn',
			'react/no-direct-mutation-state': 'warn',
			'react/no-children-prop': 'warn',
			'react/no-unknown-property': 'warn',
		},
	}),
	{
		rules: {
			'import-x/order': 'off',
			'react-refresh/only-export-components': 'warn',
			'no-constant-binary-expression': 'warn',
			'no-async-promise-executor': 'warn',
		},
	},
);
