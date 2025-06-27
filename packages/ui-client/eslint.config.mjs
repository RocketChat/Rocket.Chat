import { base, react } from '@rocket.chat/eslint-config';

export default base(react(), {
	rules: {
		'import-x/export': 'off',
	},
});
