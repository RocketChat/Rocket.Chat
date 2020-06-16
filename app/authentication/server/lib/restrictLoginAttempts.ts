import moment from 'moment';

import { ILoginAttempt } from '../ILoginAttempt';
import { ServerEvents, Users } from '../../../models/server/raw';
import { IServerEventType } from '../../../../definition/IServerEvent';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { addMinutesToADate } from '../../../utils/lib/date.helper';
import Sessions from '../../../models/server/raw/Sessions';

export const isValidLoginAttemptByIp = async (ip: string): Promise<boolean> => {
	const whitelist = String(settings.get('Accounts_Block_Failed_Attempts_Ip_Whitelist')).split(',');
	if (!settings.get('Accounts_Block_Failed_Login_Attempts_Enable_Collect_Login_data')
		|| !settings.get('Accounts_Block_Failed_Login_Attempts_By_Ip')
		|| whitelist.includes(ip)) {
		return true;
	}
	const lastLogin = await Sessions.findLastLoginByIp(ip);
	let failedAttemptsSinceLastLogin;
	if (!lastLogin) {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByIp(ip);
	} else {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByIpSince(ip, new Date(lastLogin.loginAt));
	}
	const attemptsUntilBlock = settings.get('Accounts_Block_Failed_Attempts_Until_Block_By_Ip');
	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}
	const lastAttemptAt = (await ServerEvents.findLastFailedAttemptByIp(ip))?.ts;
	if (!lastAttemptAt) {
		return true;
	}
	const minutesUntilUnblock = settings.get('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_Ip_In_Minutes') as number;
	const willBeBlockedUntil = addMinutesToADate(new Date(lastAttemptAt), minutesUntilUnblock);
	return moment(new Date()).isSameOrAfter(willBeBlockedUntil);
};

export const isValidAttemptByUser = async (login: ILoginAttempt): Promise<boolean> => {
	if (!settings.get('Accounts_Block_Failed_Login_Attempts_Enable_Collect_Login_data')
		|| !settings.get('Accounts_Block_Failed_Login_Attempts_By_User')) {
		return true;
	}
	const user = await Users.findOneByUsername(login.methodArguments[0].user?.username) || login.user;
	if (!user) {
		return true;
	}
	let failedAttemptsSinceLastLogin;
	if (!user?.lastLogin) {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsername(user.username);
	} else {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsernameSince(user.username, new Date(user.lastLogin));
	}
	const attemptsUntilBlock = settings.get('Accounts_Block_Failed_Attempts_Until_Block_By_User');
	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}
	const lastAttemptAt = (await ServerEvents.findLastFailedAttemptByUsername(user.username as string))?.ts;
	if (!lastAttemptAt) {
		return true;
	}
	const minutesUntilUnblock = settings.get('Accounts_Block_Failed_Attempts_Time_To_Unblock_By_User_In_Minutes') as number;
	const willBeBlockedUntil = addMinutesToADate(new Date(lastAttemptAt), minutesUntilUnblock);
	return moment(new Date()).isSameOrAfter(willBeBlockedUntil);
};

export const saveFailedLoginAttempts = async (login: ILoginAttempt): Promise<void> => {
	const user: any = {
		username: login.user?.username || login.methodArguments[0].user?.username,
	};
	if (login.user?._id) {
		user._id = login.user._id;
	}
	await ServerEvents.insertOne({
		ip: login.connection.clientAddress,
		t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		ts: new Date(),
		u: user as IUser,
	});
};

export const saveSuccessfulLogin = async (login: ILoginAttempt): Promise<void> => {
	await ServerEvents.insertOne({
		ip: login.connection.clientAddress,
		t: IServerEventType.LOGIN,
		ts: new Date(),
		u: login.user,
	});
};
