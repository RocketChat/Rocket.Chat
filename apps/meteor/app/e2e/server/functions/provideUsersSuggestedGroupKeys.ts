import type { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnSubscriptionChanged, notifyOnRoomChangedById } from '../../../lib/server/lib/notifyListener';

export const provideUsersSuggestedGroupKeys = async (
	userId: IUser['_id'],
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string; oldKeys?: ISubscription['oldRoomKeys'] }[]>,
) => {
	const roomIds = Object.keys(usersSuggestedGroupKeys);

	if (!roomIds.length) {
		return;
	}

	// Process should try to process all rooms i have access instead of dying if one is not
	for await (const roomId of roomIds) {
		if (!(await canAccessRoomIdAsync(roomId, userId))) {
			continue;
		}

		const usersWithSuggestedKeys = [];
		for await (const user of usersSuggestedGroupKeys[roomId]) {
			const value = await Subscriptions.setGroupE2ESuggestedKeyAndOldRoomKeys(user._id, roomId, user.key, parseOldKeysDates(user.oldKeys));
			if (!value) {
				continue;
			}
			void notifyOnSubscriptionChanged(value);
			usersWithSuggestedKeys.push(user._id);
		}

		await Rooms.removeUsersFromE2EEQueueByRoomId(roomId, usersWithSuggestedKeys);
		void notifyOnRoomChangedById(roomId);
	}
};

const parseOldKeysDates = (oldKeys: ISubscription['oldRoomKeys']) => {
	if (!oldKeys) {
		return;
	}

	return oldKeys.map((key) => ({ ...key, ts: new Date(key.ts) }));
};
