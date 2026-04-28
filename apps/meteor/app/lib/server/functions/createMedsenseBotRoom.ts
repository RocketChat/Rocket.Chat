import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { addUserToRoom } from './addUserToRoom';
import { createRoom } from './createRoom';
import { withDefaultMedsenseSessionInfo } from './medsenseSessionInfo';

type CreateMedsenseBotRoomOptions = {
	botUser: Pick<IUser, '_id' | 'username' | 'name'>;
	patientUser?: Pick<IUser, '_id' | 'username' | 'name'> | null;
	creatorUser?: Pick<IUser, '_id' | 'username' | 'name'> | null;
	roomNameSeed?: string;
	roomExtraData?: Partial<IRoom>;
};

const normalizeRoomSeed = (value?: string): string => {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return normalized || 'pending';
};

export const createMedsenseBotRoom = async ({
	botUser,
	patientUser,
	creatorUser,
	roomNameSeed,
	roomExtraData,
}: CreateMedsenseBotRoomOptions): Promise<IRoom> => {
	if (!botUser?._id || !botUser.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid bot user', {
			function: 'createMedsenseBotRoom',
		});
	}

	if (patientUser?._id && !patientUser.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid patient user', {
			function: 'createMedsenseBotRoom',
		});
	}

	if (patientUser && botUser.username === patientUser.username) {
		throw new Meteor.Error('error-invalid-user', 'Bot user cannot match patient user', {
			function: 'createMedsenseBotRoom',
		});
	}

	const owner = patientUser || creatorUser || botUser;
	if (!owner?._id || !owner.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid room owner', {
			function: 'createMedsenseBotRoom',
		});
	}

	const seed = normalizeRoomSeed(roomNameSeed || patientUser?.username || owner.username);
	const roomName = `medsense-${seed}-${botUser.username}-${Random.id(6)}`;
	const members = patientUser ? [botUser.username] : owner._id === botUser._id ? [] : [botUser.username];
	const roomData = withDefaultMedsenseSessionInfo(roomExtraData);

	const { rid } = await createRoom<'p'>('p', roomName, owner as IUser, members, false, false, roomData);
	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			function: 'createMedsenseBotRoom',
		});
	}

	if (botUser._id === owner._id) {
		return room;
	}

	const botSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
	if (!botSubscription) {
		try {
			await addUserToRoom(
				rid,
				{ _id: botUser._id, username: botUser.username },
				{ _id: owner._id, username: owner.username },
				{ skipSystemMessage: true, skipAlertSound: true },
			);
		} catch {
			// Fall back to a direct subscription if callbacks reject the bot user.
		}

		const ensured = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
		if (!ensured) {
			const now = new Date();
			await Subscriptions.createWithRoomAndUser(room, botUser as IUser, { open: true, ts: now, ls: now, alert: false, unread: 0 });
			const finalCheck = await Subscriptions.findOneByRoomIdAndUserId(rid, botUser._id, { projection: { _id: 1 } });
			if (!finalCheck) {
				throw new Meteor.Error('error-medsense-bot-user-not-added', 'Medsense bot user could not be added to the room', {
					function: 'createMedsenseBotRoom',
				});
			}
		}
	}

	return room;
};
