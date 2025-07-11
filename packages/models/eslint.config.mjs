// @ts-check
import { base } from '@rocket.chat/eslint-config';

export default base({
	rules: {
		'import-x/order': 'off',
		'no-case-declarations': 'warn',
		'no-unsafe-optional-chaining': 'warn',
		// These rules are slow, taking 93.3% of the linting time
		'@typescript-eslint/no-misused-promises': 'off', // 41.5% - 15s
		'@typescript-eslint/no-unsafe-return': 'off', // 30.2% - 11s
		'@typescript-eslint/no-floating-promises': 'off', // 21.6% - 8s
		'@typescript-eslint/no-unsafe-argument': 'off', // 31s
		'@typescript-eslint/no-unsafe-member-access': 'off', // 30.2% - 11s
		'@typescript-eslint/no-unsafe-call': 'off', // 30.2% - 11s
	},
});
