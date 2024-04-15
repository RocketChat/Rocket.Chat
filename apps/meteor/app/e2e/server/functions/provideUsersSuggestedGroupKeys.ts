import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

export const provideUsersSuggestedGroupKeys = async (
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string }[]>,
) => {
	const userId = Meteor.userId();

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const roomIds = Object.keys(usersSuggestedGroupKeys);

	if (!roomIds) {
		return;
	}

	for (const roomId of roomIds) {
		if (!(await canAccessRoomIdAsync(roomId, userId))) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}
	}

	const completedRoomIds = (
		await Promise.all(
			roomIds.map(async (roomId) => {
				const users = usersSuggestedGroupKeys[roomId];

				const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, userId);

				if (!subscription) {
					return;
				}

				users.forEach(async (user) => {
					const sub = await Subscriptions.findOneByRoomIdAndUserId(roomId, user._id);

					if (!sub) {
						return;
					}

					await Subscriptions.setGroupE2ESuggestedKey(sub._id, user.key);
				});

				return roomId;
			}),
		)
	).filter(isTruthy);

	await Rooms.removeE2EEQueueByRoomIds(completedRoomIds);
};
