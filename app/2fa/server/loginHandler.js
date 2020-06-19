import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../callbacks';
import { checkCodeForUser } from './code/index';

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	console.log(options.totp.login);
	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	console.log(1, login);
	if (login.type === 'resume') {
		return;
	}

	const { totp } = login.methodArguments[0];

	console.log(2);
	checkCodeForUser({ user: login.user, code: totp && totp.code, options: { disablePasswordFallback: true } });
	console.log(3);
}, callbacks.priority.MEDIUM, '2fa');
