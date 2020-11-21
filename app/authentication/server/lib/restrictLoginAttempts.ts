import moment from 'moment';

import { ILoginAttempt } from '../ILoginAttempt';
import { ServerEvents, Users } from '../../../models/server/raw';
import { IServerEventType } from '../../../../definition/IServerEvent';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { addMinutesToADate } from '../../../utils/lib/date.helper';
import Sessions from '../../../models/server/raw/Sessions';
import { getClientAddress } from '../../../../server/lib/getClientAddress';

export const isValidLoginAttemptByIp = async (ip: string): Promise<boolean> => {
	const whitelist = String(settings.get('Block_Multiple_Failed_Logins_Ip_Whitelist')).split(',');

	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')
		|| !settings.get('Block_Multiple_Failed_Logins_By_Ip')
		|| whitelist.includes(ip)) {
		return true;
	}

	const lastLogin = await Sessions.findLastLoginByIp(ip) as {loginAt?: Date} | undefined;
	let failedAttemptsSinceLastLogin;

	if (!lastLogin || !lastLogin.loginAt) {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByIp(ip);
	} else {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByIpSince(ip, new Date(lastLogin.loginAt));
	}

	const attemptsUntilBlock = settings.get('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip');

	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	const lastAttemptAt = (await ServerEvents.findLastFailedAttemptByIp(ip))?.ts;

	if (!lastAttemptAt) {
		return true;
	}

	const minutesUntilUnblock = settings.get('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes') as number;
	const willBeBlockedUntil = addMinutesToADate(new Date(lastAttemptAt), minutesUntilUnblock);

	return moment(new Date()).isSameOrAfter(willBeBlockedUntil);
};

export const isValidAttemptByUser = async (login: ILoginAttempt): Promise<boolean> => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled')
		|| !settings.get('Block_Multiple_Failed_Logins_By_User')) {
		return true;
	}

	const user = login.user || await Users.findOneByUsername(login.methodArguments[0].user?.username);

	if (!user) {
		return true;
	}

	let failedAttemptsSinceLastLogin;

	if (!user?.lastLogin) {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsername(user.username);
	} else {
		failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsernameSince(user.username, new Date(user.lastLogin));
	}

	const attemptsUntilBlock = settings.get('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User');

	if (attemptsUntilBlock && failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	const lastAttemptAt = (await ServerEvents.findLastFailedAttemptByUsername(user.username as string))?.ts;

	if (!lastAttemptAt) {
		return true;
	}

	const minutesUntilUnblock = settings.get('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes') as number;
	const willBeBlockedUntil = addMinutesToADate(new Date(lastAttemptAt), minutesUntilUnblock);

	return moment(new Date()).isSameOrAfter(willBeBlockedUntil);
};

export const saveFailedLoginAttempts = async (login: ILoginAttempt): Promise<void> => {
	const user: Partial<IUser> = {
		_id: login.user?._id,
		username: login.user?.username || login.methodArguments[0].user?.username,
	};

	await ServerEvents.insertOne({
		ip: getClientAddress(login.connection),
		t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		ts: new Date(),
		u: user,
	});
};

export const saveSuccessfulLogin = async (login: ILoginAttempt): Promise<void> => {
	await ServerEvents.insertOne({
		ip: getClientAddress(login.connection),
		t: IServerEventType.LOGIN,
		ts: new Date(),
		u: login.user,
	});
};
