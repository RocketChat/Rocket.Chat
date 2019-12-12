import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../callbacks';
import { checkCodeForUser } from './code';

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	if (login.type !== 'password') {
		return;
	}

	const { totp } = login.methodArguments[0];

	checkCodeForUser(login.user, totp && totp.code);
}, callbacks.priority.MEDIUM, '2fa');
