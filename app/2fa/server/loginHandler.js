import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { verifyOrSend } from './email';
import { verify } from './totp';

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	if (login.type !== 'password' || !settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return;
	}

	const { totp } = login.methodArguments[0];

	verify(login.user, totp && totp.code);

	verifyOrSend(login.user, totp && totp.code);
}, callbacks.priority.MEDIUM, '2fa');
