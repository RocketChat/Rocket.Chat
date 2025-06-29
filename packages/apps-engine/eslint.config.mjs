import { base } from '@rocket.chat/eslint-config';

export default base({
	ignores: ['client/**/*', 'server/**/*', 'definition/**/*', 'lib/**/*', 'deno-runtime/**/*', '.deno-cache/**/*'],
});
