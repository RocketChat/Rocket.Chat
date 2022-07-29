import { Accounts } from 'meteor/accounts-base';

import { ILoginAttempt } from '../ILoginAttempt';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';
import { logFailedLoginAttempts } from '../lib/logLoginAttempts';
import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

Accounts.onLoginFailure((login: ILoginAttempt) => {
	if (settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		saveFailedLoginAttempts(login);
	}

	logFailedLoginAttempts(login);
});

callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		return;
	}

	saveSuccessfulLogin(login);
});
