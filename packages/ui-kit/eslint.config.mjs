// @ts-check
import { base } from '@rocket.chat/eslint-config';

export default base({
	rules: {
		'@typescript-eslint/no-duplicate-enum-values': 'off',
		'import-x/order': 'off',
		'@stylistic/brace-style': 'off',
	},
});
