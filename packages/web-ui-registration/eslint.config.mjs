import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/no-children-prop': 'warn',
		},
	}),
	{
		rules: {
			'react-refresh/only-export-components': 'warn',
		},
	},
);
