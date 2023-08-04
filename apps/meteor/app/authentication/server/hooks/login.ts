import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';
import { logFailedLoginAttempts } from '../lib/logLoginAttempts';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';

Accounts.onLoginFailure(async (login: ILoginAttempt) => {
	// do not save failed login attempts if the user is already blocked
	if (settings.get('Block_Multiple_Failed_Logins_Enabled') && login.error.error !== 'error-login-blocked-for-user') {
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
