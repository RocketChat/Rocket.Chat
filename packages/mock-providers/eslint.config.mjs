import { base, react } from '@rocket.chat/eslint-config';

export default base(
	react({
		rules: {
			'react/prop-types': 'warn',
		},
	}),
);
