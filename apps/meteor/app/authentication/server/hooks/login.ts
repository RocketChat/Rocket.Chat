import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../../../server/lib/callbacks';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';
import { logFailedLoginAttempts } from '../lib/logLoginAttempts';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';

// Only ignore TOTP-required failures.
// Both error-login-blocked-for-user and error-login-blocked-for-ip are intentionally
// NOT ignored here so that all block-type failures are stored consistently in ServerEvents
// for accurate security telemetry.
const ignoredErrorTypes = ['totp-required'];

Accounts.onLoginFailure(async (login: ILoginAttempt) => {
	// Save failed login attempts consistently for both user and IP blocks
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