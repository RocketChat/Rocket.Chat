import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';

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
