import type { IServerEvent } from '@rocket.chat/core-typings';
import { ServerEventType } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Rooms, ServerEvents, Users } from '@rocket.chat/models';

import { addMinutesToADate } from '../../../../lib/utils/addMinutesToADate';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';
import type { ILoginAttempt } from '../ILoginAttempt';

const logger = new Logger('LoginProtection');

const notifyFailedLogin = async (ipOrUsername: string, blockedUntil: Date, failedAttempts: number): Promise<void> => {
	const channelToNotify = settings.get<string>('Block_Multiple_Failed_Logins_Notify_Failed_Channel');

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

	// misconfigured
	const attemptsUntilBlock = settings.get<number>('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip');
	if (!attemptsUntilBlock) {
		return true;
	}

	// if user never failed to login, then it's valid
	const lastFailedAttemptAt = (await ServerEvents.findLastFailedAttemptByIp(ip))?.ts;
	if (!lastFailedAttemptAt) {
		return true;
	}

	const minutesUntilUnblock = settings.get<number>('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes');

	const lockoutTimeStart = addMinutesToADate(new Date(), minutesUntilUnblock * -1);
	const lastSuccessfulAttemptAt = (await ServerEvents.findLastSuccessfulAttemptByIp(ip))?.ts;

	// successful logins should reset the counter
	const startTime = lastSuccessfulAttemptAt
		? new Date(Math.max(lockoutTimeStart.getTime(), lastSuccessfulAttemptAt.getTime()))
		: lockoutTimeStart;

	const failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByIpSince(ip, startTime);

	// if user didn't reach the threshold, then it's valid
	if (failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	if (settings.get('Block_Multiple_Failed_Logins_Notify_Failed')) {
		const willBeBlockedUntil = addMinutesToADate(new Date(lastFailedAttemptAt), minutesUntilUnblock);

		await notifyFailedLogin(ip, willBeBlockedUntil, failedAttemptsSinceLastLogin);
	}

	return false;
};

export const isValidAttemptByUser = async (login: ILoginAttempt): Promise<boolean> => {
	if (!settings.get('Block_Multiple_Failed_Logins_Enabled') || !settings.get('Block_Multiple_Failed_Logins_By_User')) {
		return true;
	}

	const loginUsername = login.methodArguments[0].user?.username;
	if (!loginUsername) {
		return true;
	}

	// misconfigured
	const attemptsUntilBlock = settings.get<number>('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User');
	if (!attemptsUntilBlock) {
		return true;
	}

	// if user never failed to login, then it's valid
	const lastFailedAttemptAt = (await ServerEvents.findLastFailedAttemptByUsername(loginUsername))?.ts;
	if (!lastFailedAttemptAt) {
		return true;
	}

	const minutesUntilUnblock = settings.get<number>('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes');

	const lockoutTimeStart = addMinutesToADate(new Date(), minutesUntilUnblock * -1);
	const lastSuccessfulAttemptAt = (await ServerEvents.findLastSuccessfulAttemptByUsername(loginUsername))?.ts;

	// succesful logins should reset the counter
	const startTime = lastSuccessfulAttemptAt
		? new Date(Math.max(lockoutTimeStart.getTime(), lastSuccessfulAttemptAt.getTime()))
		: lockoutTimeStart;

	// get total failed attempts during the lockout time
	const failedAttemptsSinceLastLogin = await ServerEvents.countFailedAttemptsByUsernameSince(loginUsername, startTime);

	// if user didn't reach the threshold, then it's valid
	if (failedAttemptsSinceLastLogin < attemptsUntilBlock) {
		return true;
	}

	if (settings.get('Block_Multiple_Failed_Logins_Notify_Failed')) {
		const willBeBlockedUntil = addMinutesToADate(new Date(lastFailedAttemptAt), minutesUntilUnblock);

		await notifyFailedLogin(loginUsername, willBeBlockedUntil, failedAttemptsSinceLastLogin);
	}

	return false;
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
