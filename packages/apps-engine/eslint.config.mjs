// @ts-check
import { base } from '@rocket.chat/eslint-config';

export default base(
	{
		ignores: ['client/**/*', 'server/**/*', 'definition/**/*', 'lib/**/*', 'deno-runtime/**/*', '.deno-cache/**/*'],
	},
	{
		rules: {
			'import-x/order': 'off',
			'import-x/namespace': 'off',
			'prefer-const': 'off',
			'no-prototype-builtins': 'off',
		},
	},
);
