import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Random } from '@rocket.chat/random';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { createRoom } from '../../app/lib/server/functions/createRoom';
import { addUserToRoom } from '../../app/lib/server/functions/addUserToRoom';
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

export const medsenseCreateBotRoom = async (
	userId: IUser['_id'] | null,
	options: MedsenseCreateBotRoomOptions = {},
): Promise<string> => {
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

	const roomName = `medsense-${user.username}-${botUsername}-${Random.id(6)}`;
	const { rid } = await createRoom<'p'>('p', roomName, user, [botUser.username]);
	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'medsenseCreateBotRoom',
		});
	}

	const botSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
	if (!botSubscription) {
		try {
			await addUserToRoom(
				rid,
				{ _id: botUser._id, username: botUser.username },
				{ _id: user._id, username: user.username },
				{ skipSystemMessage: true, skipAlertSound: true },
			);
		} catch (error) {
			// Fall back to a direct subscription if callbacks reject the bot user.
		}

		const ensured = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
		if (!ensured) {
			const now = new Date();
			await Subscriptions.createWithRoomAndUser(room, botUser, { open: true, ts: now, ls: now, alert: false, unread: 0 });
			const finalCheck = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
			if (!finalCheck) {
				throw new Meteor.Error('error-medsense-bot-user-not-added', 'Medsense bot user could not be added to the room', {
					method: 'medsenseCreateBotRoom',
				});
			}
		}
	}

	if (greeting) {
		await sendMessage(user, { msg: greeting }, room);
	}

	return rid;
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
