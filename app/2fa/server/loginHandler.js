import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { check } from 'meteor/check';

import { callbacks } from '../../callbacks';
import { checkCodeForUser } from './code/index';

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	if (login.type === 'resume' || login.type === 'proxy') {
		return login;
	}

	const { totp } = login.methodArguments[0];

	checkCodeForUser({ user: login.user, code: totp && totp.code, options: { disablePasswordFallback: true } });

	return login;
}, callbacks.priority.MEDIUM, '2fa');

const defaultRetrieveMethod = OAuth._retrievePendingCredential;
OAuth._retrievePendingCredential = function(key, ...args) {
	const credentialSecret = args.length > 0 && args[0] !== undefined ? args[0] : null;
	check(key, String);

	const pendingCredential = OAuth._pendingCredentials.findOne({
		key,
		credentialSecret,
	});

	const result = defaultRetrieveMethod(key, ...args);

	if (pendingCredential?.credential?.serviceData?._OAuthCustom) {
		// Keep OAuth pending credentials alive for two extra minutes so they can be re-used in case of 2FA
		OAuth._storePendingCredential(key, pendingCredential.credential, pendingCredential.credentialSecret);
		setTimeout(() => {
			OAuth._pendingCredentials.remove({
				key,
			});
		}, 2 * 60 * 1000);
	}

	return result;
};
