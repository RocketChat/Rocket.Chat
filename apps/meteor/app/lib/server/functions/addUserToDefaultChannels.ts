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
