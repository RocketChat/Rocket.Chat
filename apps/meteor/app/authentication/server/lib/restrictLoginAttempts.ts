import moment from 'moment';
import type { IServerEvent } from '@rocket.chat/core-typings';
import { ServerEventType } from '@rocket.chat/core-typings';

import { ILoginAttempt } from '../ILoginAttempt';
import { ServerEvents, Users, Rooms, Sessions } from '../../../models/server/raw';
import { settings } from '../../../settings/server';
import { addMinutesToADate } from '../../../../lib/utils/addMinutesToADate';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { sendMessage } from '../../../lib/server/functions';
import { Logger } from '../../../logger/server';

const logger = new Logger('LoginProtection');

export const notifyFailedLogin = async (ipOrUsername: string, blockedUntil: Date, failedAttempts: number): Promise<void> => {
	const channelToNotify = settings.get('Block_Multiple_Failed_Logins_Notify_Failed_Channel');
	if (!channelToNotify) {
		logger.error('Cannot notify failed logins: channel provided is invalid');
		return;
	}
	// verify channel exists
	// to avoid issues when "fname" is presented in the UI, check if the name matches it as well
	const room = await Rooms.findOneByNameOrFname(channelToNotify);
	if (!room) {
		logger.error("Cannot notify failed logins: channel provided doesn't exists");
		return;
	}

	const rocketCat = await Users.findOneById('rocket.cat');
	// send message
	const message = {
		attachments: [
			{
				fields: [
					{
						title: 'Failed login attempt threshold exceeded',
						value: `User or IP: ${ipOrUsername}\nBlocked until: ${blockedUntil}\nFailed Attempts: ${failedAttempts}`,
						short: true,
					},
				],
				color: 'red',
			},
		],
	};

	await sendMessage(rocketCat, message, room, false);
};

export const isValidLoginAttemptByIp = async (ip: string): Promise<boolean> => {
	const whitelist = String(settings.get('Block_Multiple_Failed_Logins_Ip_Whitelist')).split(',');

	if (
		!settings.get('Block_Multiple_Failed_Logins_Enabled') ||
		!settings.get('Block_Multiple_Failed_Logins_By_Ip') ||
		whitelist.includes(ip)
	) {
		return true;
	}

	const lastLogin = await Sessions.findLastLoginByIp(ip);
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
	const isValid = moment(new Date()).isSameOrAfter(willBeBlockedUntil);

	if (settings.get('Block_Multiple_Failed_Logins_Notify_Failed') && !isValid) {
		notifyFailedLogin(ip, willBeBlockedUntil, failedAttemptsSinceLastLogin);
	}

	return isValid;
};

export const isValidAttemptByUser = async (login: ILoginAttempt): Promise<boolean> => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled') || !settings.get('Block_Multiple_Failed_Logins_By_User')) {
		return true;
	}

	const user = login.user || (await Users.findOneByUsername(login.methodArguments[0].user?.username));

	if (!user?.username) {
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
	const isValid = moment(new Date()).isSameOrAfter(willBeBlockedUntil);

	if (settings.get('Block_Multiple_Failed_Logins_Notify_Failed') && !isValid) {
		notifyFailedLogin(user.username, willBeBlockedUntil, failedAttemptsSinceLastLogin);
	}

	return isValid;
};

export const saveFailedLoginAttempts = async (login: ILoginAttempt): Promise<void> => {
	const user: IServerEvent['u'] = {
		_id: login.user?._id,
		username: login.user?.username || login.methodArguments[0].user?.username,
	};

	await ServerEvents.insertOne({
		ip: getClientAddress(login.connection),
		t: ServerEventType.FAILED_LOGIN_ATTEMPT,
		ts: new Date(),
		u: user,
	});
};

export const saveSuccessfulLogin = async (login: ILoginAttempt): Promise<void> => {
	const user: IServerEvent['u'] = {
		_id: login.user?._id,
		username: login.user?.username || login.methodArguments[0].user?.username,
	};

	await ServerEvents.insertOne({
		ip: getClientAddress(login.connection),
		t: ServerEventType.LOGIN,
		ts: new Date(),
		u: user,
	});
};
