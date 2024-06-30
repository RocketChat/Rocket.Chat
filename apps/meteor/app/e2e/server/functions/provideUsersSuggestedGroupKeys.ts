import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

export const provideUsersSuggestedGroupKeys = async (
	userId: IUser['_id'],
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string }[]>,
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
			const { modifiedCount } = await Subscriptions.setGroupE2ESuggestedKey(user._id, roomId, user.key);
			if (!modifiedCount) {
				continue;
			}
			usersWithSuggestedKeys.push(user._id);
		}

		await Rooms.removeUsersFromE2EEQueueByRoomId(roomId, usersWithSuggestedKeys);
	}
};
