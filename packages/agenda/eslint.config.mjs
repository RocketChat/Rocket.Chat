import { base } from '@rocket.chat/eslint-config';

export default base({
	rules: {
		'no-async-promise-executor': 'warn',
		'no-prototype-builtins': 'warn',
		'@stylistic/indent': 'off',
		'@stylistic/indent-binary-ops': 'off',
	},
});
