import { ILoginAttempt } from '../ILoginAttempt';
import { settings } from '../../../settings/server';

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
	let forwardedFor = connection.httpHeaders['x-forwarded-for'];
	if (!settings.get('Login_Logs_ForwardedForIp')) {
		forwardedFor = '-';
	}
	let userAgent = connection.httpHeaders['user-agent'];
	if (!settings.get('Login_Logs_UserAgent')) {
		userAgent = '-';
	}
	console.log('Failed login detected - Username[%s] ClientAddress[%s] ForwardedFor[%s] UserAgent[%s]', user, clientAddress, forwardedFor, userAgent);
};
