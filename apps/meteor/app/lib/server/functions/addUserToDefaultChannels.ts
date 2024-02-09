import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { getSubscriptionAutotranslateDefaultConfig } from '../../../../server/lib/getSubscriptionAutotranslateDefaultConfig';

export const addUserToDefaultChannels = async function (user: IUser, silenced?: boolean): Promise<void> {
	await callbacks.run('beforeJoinDefaultChannels', user);
	const defaultRooms = await Rooms.findByDefaultAndTypes(true, ['c', 'p'], {
		projection: { usernames: 0 },
	}).toArray();

	const roomsThatAreGoingToBeJoined = new Set(defaultRooms.map((room) => room._id));

	// If any of those are teams, we need to get all the channels that have the auto-join flag as well
	const teamRooms = defaultRooms.filter((room) => room.teamMain && room.teamId);
	if (teamRooms.length > 0) {
		for await (const teamRoom of teamRooms) {
			const defaultTeamRooms = await Rooms.findDefaultRoomsForTeam(teamRoom.teamId).toArray();

			const defaultTeamRoomsThatWereNotAlreadyAdded = defaultTeamRooms.filter((channel) => !roomsThatAreGoingToBeJoined.has(channel._id));

			defaultTeamRoomsThatWereNotAlreadyAdded.forEach((channel) => roomsThatAreGoingToBeJoined.add(channel._id));
			// Add the channels to the defaultRooms list
			defaultRooms.push(...defaultTeamRoomsThatWereNotAlreadyAdded);
		}
	}

	for await (const room of defaultRooms) {
		if (!(await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { _id: 1 } }))) {
			const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(user);
			// Add a subscription to this user
			await Subscriptions.createWithRoomAndUser(room, user, {
				ts: new Date(),
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
				...(room.favorite && { f: true }),
				...autoTranslateConfig,
			});

			// Insert user joined message
			if (!silenced) {
				await Message.saveSystemMessage('uj', room._id, user.username || '', user);
			}
		}
	}
};
