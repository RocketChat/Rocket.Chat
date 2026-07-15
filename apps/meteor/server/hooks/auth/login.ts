import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../../app/settings/server';
import type { ILoginAttempt } from '../../lib/auth/ILoginAttempt';
import { logFailedLoginAttempts } from '../../lib/auth/logLoginAttempts';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../../lib/auth/restrictLoginAttempts';
import { callbacks } from '../../lib/callbacks';

const ignoredErrorTypes = ['totp-required', 'error-login-blocked-for-user'];

Accounts.onLoginFailure(async (login: ILoginAttempt) => {
	// do not save specific failed login attempts
	if (
		settings.get('Block_Multiple_Failed_Logins_Enabled') &&
		login.error?.error &&
		!ignoredErrorTypes.includes(String(login.error.error))
	) {
		await saveFailedLoginAttempts(login);
	}

	logFailedLoginAttempts(login);
});

callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		return;
	}

	return saveSuccessfulLogin(login);
});
