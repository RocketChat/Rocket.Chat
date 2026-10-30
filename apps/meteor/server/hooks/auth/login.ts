import { Accounts } from 'meteor/accounts-base';

import type { ILoginAttempt } from '../../lib/auth/ILoginAttempt';
import { recordFailedLoginAttempt } from '../../lib/auth/recordFailedLoginAttempt';
import { saveSuccessfulLogin } from '../../lib/auth/restrictLoginAttempts';
import { callbacks } from '../../lib/callbacks';
import { settings } from '../../settings';

Accounts.onLoginFailure((login: ILoginAttempt) => recordFailedLoginAttempt(login));

callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		return;
	}

	return saveSuccessfulLogin(login);
});
