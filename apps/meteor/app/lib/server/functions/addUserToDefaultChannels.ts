import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { getSubscriptionAutotranslateDefaultConfig } from '../../../../server/lib/getSubscriptionAutotranslateDefaultConfig';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';
import { notifyOnSubscriptionChangedById } from '../lib/notifyListener';
import { getDefaultChannels } from './getDefaultChannels';

export const addUserToDefaultChannels = async function (user: IUser, silenced?: boolean): Promise<void> {
	await callbacks.run('beforeJoinDefaultChannels', user);
	const defaultRooms = await getDefaultChannels();

	for await (const room of defaultRooms) {
		if (!(await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { _id: 1 } }))) {
			const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(user);

			// Add a subscription to this user
			const { insertedId } = await Subscriptions.createWithRoomAndUser(room, user, {
				ts: new Date(),
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
				...(room.favorite && { f: true }),
				...autoTranslateConfig,
				...getDefaultSubscriptionPref(user),
			});

			if (insertedId) {
				void notifyOnSubscriptionChangedById(insertedId, 'inserted');
			}

			// Insert user joined message
			if (!silenced) {
				await Message.saveSystemMessage('uj', room._id, user.username || '', user);
			}
		}
	}
};
