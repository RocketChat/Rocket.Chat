import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../../../server/lib/callbacks';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';
import { logFailedLoginAttempts } from '../lib/logLoginAttempts';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';
import { anomalyAggregator } from '../lib/LoginAnomalyAggregator';

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
    const ip = login.connection.clientAddress;
    const userId = login.user?._id;

    if (ip) {
        anomalyAggregator.logFailure(ip, userId);
    }
});

callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		return;
	}

	return saveSuccessfulLogin(login);
});
