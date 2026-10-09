import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { getDefaultChannels } from './getDefaultChannels';
import { isRoomAbacLocked } from '../../../lib/rooms/isRoomAbacLocked';
import { settings } from '../../settings';
import { getRoomAbacLockContext } from '../authorization/getRoomAbacLockContext';
import { callbacks } from '../callbacks';
import { getSubscriptionAutotranslateDefaultConfig } from '../getSubscriptionAutotranslateDefaultConfig';
import { notifyOnSubscriptionChangedById } from '../notifyListener';
import { getDefaultSubscriptionPref } from '../utils/lib/getDefaultSubscriptionPref';

export const addUserToDefaultChannels = async function (user: IUser, silenced?: boolean): Promise<void> {
	await callbacks.run('beforeJoinDefaultChannels', user);
	const lockContext = getRoomAbacLockContext();
	const defaultRooms = (await getDefaultChannels()).filter((room) => !isRoomAbacLocked(room, lockContext));

	for (const room of defaultRooms) {
		if (settings.get('ABAC_Enabled') && room?.abacAttributes?.length) {
			continue;
		}

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
