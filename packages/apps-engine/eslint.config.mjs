import { config } from '@rocket.chat/eslint-config/base';

export default [
	...config,
	{
		ignores: ['client/**/*', 'server/**/*', 'definition/**/*', 'lib/**/*', 'deno-runtime/**/*', '.deno-cache/**/*'],
	},
];
