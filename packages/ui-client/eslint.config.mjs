// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(react(), {
	rules: {
		'import-x/export': 'off',
		'import-x/order': 'off',
	},
});
