import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';

export const logFailedLoginAttempts = (login: ILoginAttempt): void => {
	if (!settings.get('Login_Logs_Enabled')) {
		return;
	}

	let user = 'unknown';
	if (login.methodArguments[0]?.user?.username && settings.get('Login_Logs_Username')) {
		user = login.methodArguments[0]?.user?.username;
	}
	const { connection } = login;
	let { clientAddress } = connection;
	if (!settings.get('Login_Logs_ClientIp')) {
		clientAddress = '-';
	}
	let forwardedFor = connection.httpHeaders?.['x-forwarded-for'];
	let realIp = connection.httpHeaders?.['x-real-ip'];
	if (!settings.get('Login_Logs_ForwardedForIp')) {
		forwardedFor = '-';
		realIp = '-';
	}
	let userAgent = connection.httpHeaders?.['user-agent'];
	if (!settings.get('Login_Logs_UserAgent')) {
		userAgent = '-';
	}
	let isDeactivated = false;
	let daysInactive = 0;
	const reason = login.error?.reason || login.error?.message;

	if (login.user) {
		isDeactivated = login.user.active === false;
		if (login.user.lastLogin) {
			const msInactive = Date.now() - new Date(login.user.lastLogin).getTime();
			daysInactive = Math.floor(msInactive / (1000 * 60 * 60 * 24));
		}
	}
	SystemLogger.info({
		msg: 'Failed login detected',
		user,
		clientAddress,
		forwardedFor,
		realIp,
		userAgent,
		...(reason && { reason }),
		...(isDeactivated && { accountStatus: 'deactivated', deactivatedWarning: 'Login attempt on deactivated account' }),
		...(daysInactive >= 180 && { daysInactive, dormantWarning: 'Login attempt on dormant account' })
	});
};
