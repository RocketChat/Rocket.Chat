import type { ILoginAttempt } from '../ILoginAttempt';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

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
	SystemLogger.info(
		`Failed login detected - Username[${user}] ClientAddress[${clientAddress}] ForwardedFor[${forwardedFor}] XRealIp[${realIp}] UserAgent[${userAgent}]`,
	);
};
