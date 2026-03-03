import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { createMedsenseBotRoom as createMedsenseBotRoomForUsers } from '../../app/lib/server/functions/createMedsenseBotRoom';
import { sendMessage } from '../../app/lib/server/functions/sendMessage';
import { RateLimiterClass as RateLimiter } from '../../app/lib/server/lib/RateLimiter';
import { settings } from '../../app/settings/server';

const normalizeRoleSetting = (rolesSetting: unknown): string[] => {
	if (Array.isArray(rolesSetting)) {
		return rolesSetting.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
	}

	if (typeof rolesSetting === 'string') {
		return rolesSetting
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean);
	}

	return [];
};

type MedsenseCreateBotRoomOptions = {
	greeting?: string;
};

export const medsenseCreateBotRoom = async (userId: IUser['_id'] | null, options: MedsenseCreateBotRoomOptions = {}): Promise<string> => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseCreateBotRoom',
		});
	}

	check(userId, String);
	check(options, Match.Maybe({ greeting: Match.Maybe(String) }));

	const greeting = typeof options.greeting === 'string' ? options.greeting.trim() : '';

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1, roles: 1 } });
	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseCreateBotRoom',
		});
	}

	const allowedRoles = normalizeRoleSetting(settings.get('Medsense_Start_Chat_Roles'));
	const userRoles = Array.isArray(user.roles) ? user.roles : [];
	if (allowedRoles.length === 0 || !userRoles.some((role) => allowedRoles.includes(role))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'medsenseCreateBotRoom',
		});
	}

	const botUsernameSetting = settings.get('Medsense_Bot_User');
	const botUsername = typeof botUsernameSetting === 'string' ? botUsernameSetting.trim() : '';
	if (!botUsername) {
		throw new Meteor.Error('error-medsense-bot-user-not-configured', 'Medsense bot user not configured', {
			method: 'medsenseCreateBotRoom',
		});
	}

	const botUser = await Users.findOneByUsernameIgnoringCase(botUsername, { projection: { username: 1, name: 1 } });
	if (!botUser?.username) {
		throw new Meteor.Error('error-medsense-bot-user-not-found', 'Medsense bot user not found', {
			method: 'medsenseCreateBotRoom',
		});
	}

	if (botUser.username === user.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseCreateBotRoom',
		});
	}

	const room = await createMedsenseBotRoomForUsers({
		patientUser: user,
		botUser,
	});

	if (greeting) {
		await sendMessage(user, { msg: greeting }, room);
	}

	return room._id;
};

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		medsenseCreateBotRoom(options?: MedsenseCreateBotRoomOptions): string;
	}
}

Meteor.methods<ServerMethods>({
	async medsenseCreateBotRoom(options?: MedsenseCreateBotRoomOptions) {
		return medsenseCreateBotRoom(Meteor.userId(), options);
	},
});

RateLimiter.limitMethod('medsenseCreateBotRoom', 5, 60000, {});
