// @ts-check
import { base, jest } from '@rocket.chat/eslint-config';

export default base(
	jest({
		files: ['tests/**/*'],
	}),
);
