// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(react(), {
	rules: {
		'import-x/order': 'off',
		'react-refresh/only-export-components': 'warn',
	},
});
