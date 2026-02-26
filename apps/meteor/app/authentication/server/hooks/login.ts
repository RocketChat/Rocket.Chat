import { Accounts } from 'meteor/accounts-base';

import { ServerEvents } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';
import { logFailedLoginAttempts } from '../lib/logLoginAttempts';
import { saveFailedLoginAttempts, saveSuccessfulLogin } from '../lib/restrictLoginAttempts';

const ignoredErrorTypes = ['totp-required', 'error-login-blocked-for-user'];

Accounts.onLoginFailure(async (login: ILoginAttempt) => {
	if (login.error?.error === 'error-user-is-not-activated' || login.user?.active === false) {
		SystemLogger.warn({
			msg: 'Suspicious login: Deactivated user attempting login',
			user: login.user?.username || login.methodArguments?.[0]?.user?.username,
			clientAddress: login.connection?.clientAddress,
		});
	}

	// do not save specific failed login attempts
	if (
		settings.get('Block_Multiple_Failed_Logins_Enabled') &&
		login.error?.error &&
		!ignoredErrorTypes.includes(String(login.error.error))
	) {
		await saveFailedLoginAttempts(login);
	}

	const loginUsername = login.user?.username || login.methodArguments?.[0]?.user?.username;
	if (loginUsername) {
		const startTime = new Date(Date.now() - 5 * 60000); // last 5 minutes
		const failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsernameSince(loginUsername, startTime);

		if (failedAttemptsSinceLastLogin >= 3) {
			SystemLogger.warn({
				msg: 'Suspicious login: Multiple failed attempts detected',
				user: loginUsername,
				failedAttempts: failedAttemptsSinceLastLogin,
				clientAddress: login.connection?.clientAddress,
			});
		}
	}

	logFailedLoginAttempts(login);
});

callbacks.add('afterValidateLogin', (login: ILoginAttempt) => {
	if (login.user?.lastLogin) {
		const inactiveTimeMs = Date.now() - new Date(login.user.lastLogin).getTime();
		const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
		if (inactiveTimeMs > ninetyDaysMs) {
			SystemLogger.warn({
				msg: 'Suspicious login: Login after long inactivity',
				user: login.user.username,
				inactivePeriodDays: Math.floor(inactiveTimeMs / (1000 * 60 * 60 * 24)),
				clientAddress: login.connection?.clientAddress,
			});
		}
	}

	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')) {
		return;
	}

	return saveSuccessfulLogin(login);
});
