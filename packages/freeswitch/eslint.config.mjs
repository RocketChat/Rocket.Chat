// @ts-check
import { base, jest } from '@rocket.chat/eslint-config';

export default base(
	jest({
		rules: {
			'jest/no-standalone-expect': 'off',
		},
	}),
	{
		rules: {
			'import-x/order': 'off',
		},
	},
);
