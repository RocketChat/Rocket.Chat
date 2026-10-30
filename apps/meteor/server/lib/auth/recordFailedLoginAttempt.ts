import type { ILoginAttempt } from './ILoginAttempt';
import { logFailedLoginAttempts } from './logLoginAttempts';
import { saveFailedLoginAttempts } from './restrictLoginAttempts';
import { settings } from '../../settings';

const ignoredErrorTypes = ['totp-required', 'error-login-blocked-for-user'];

export const recordFailedLoginAttempt = async (login: ILoginAttempt): Promise<void> => {
	if (
		settings.get('Block_Multiple_Failed_Logins_Enabled') &&
		login.error?.error &&
		!ignoredErrorTypes.includes(String(login.error.error))
	) {
		await saveFailedLoginAttempts(login);
	}

	logFailedLoginAttempts(login);
};
