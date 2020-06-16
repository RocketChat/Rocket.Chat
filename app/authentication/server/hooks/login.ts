import { Accounts } from 'meteor/accounts-base';

import { ILoginAttempt } from '../ILoginAttempt';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';
import { logFailedLoginAttemps } from '../lib/logLoginAttempts';
import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings/server';

Accounts.onLoginFailure((login: ILoginAttempt) => {
	if (!settings.get('Accounts_Block_Failed_Login_Attempts_Enable_Collect_Login_data')) {
		return;
	}
	saveFailedLoginAttempts(login);
	logFailedLoginAttemps(login);
});
callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (!settings.get('Accounts_Block_Failed_Login_Attempts_Enable_Collect_Login_data')) {
		return;
	}
	saveSuccessfulLogin(login);
});
