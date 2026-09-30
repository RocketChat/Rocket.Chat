import { Accounts } from 'meteor/accounts-base';

import { checkCodeForUser } from './code';
import { callbacks } from '../callbacks';

Accounts.registerLoginHandler('totp', function (options) {
	if (!options.totp?.code) {
		return;
	}

	// @ts-expect-error - not sure how to type this yet
	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add(
	'onValidateLogin',
	async (login) => {
		if (
			!login.user ||
			login.type === 'resume' ||
			login.type === 'proxy' ||
			login.type === 'cas' ||
			(login.type === 'password' && login.methodName === 'resetPassword') ||
			login.methodName === 'verifyEmail'
		) {
			return login;
		}

		const [loginArgs] = login.methodArguments;
		const { totp } = loginArgs;

		await checkCodeForUser({
			user: login.user,
			code: totp?.code,
			options: { disablePasswordFallback: true },
		});

		return login;
	},
	callbacks.priority.MEDIUM,
	'2fa',
);
