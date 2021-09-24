import { ILoginAttempt } from '../ILoginAttempt';
import { SettingsVersion4 } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export const logFailedLoginAttempts = (login: ILoginAttempt): void => {
	if (!SettingsVersion4.get('Login_Logs_Enabled')) {
		return;
	}

	let user = 'unknown';
	if (login.methodArguments[0]?.user?.username && SettingsVersion4.get('Login_Logs_Username')) {
		user = login.methodArguments[0]?.user?.username;
	}
	const { connection } = login;
	let { clientAddress } = connection;
	if (!SettingsVersion4.get('Login_Logs_ClientIp')) {
		clientAddress = '-';
	}
	let forwardedFor = connection.httpHeaders && connection.httpHeaders['x-forwarded-for'];
	let realIp = connection.httpHeaders && connection.httpHeaders['x-real-ip'];
	if (!SettingsVersion4.get('Login_Logs_ForwardedForIp')) {
		forwardedFor = '-';
		realIp = '-';
	}
	let userAgent = connection.httpHeaders && connection.httpHeaders['user-agent'];
	if (!SettingsVersion4.get('Login_Logs_UserAgent')) {
		userAgent = '-';
	}
	SystemLogger.info(`Failed login detected - Username[${ user }] ClientAddress[${ clientAddress }] ForwardedFor[${ forwardedFor }] XRealIp[${ realIp }] UserAgent[${ userAgent }]`);
};
