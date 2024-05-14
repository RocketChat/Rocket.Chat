import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import type { isE2EProvideUsersGroupKeyProps } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

export const provideUsersSuggestedGroupKeys = async (
	userId: IUser['_id'],
	usersSuggestedGroupKeys: isE2EProvideUsersGroupKeyProps['usersSuggestedGroupKeys'],
) => {
	const roomIds = Object.keys(usersSuggestedGroupKeys);

	if (!roomIds) {
		return;
	}

	await Promise.all(
		roomIds.map(async (roomId) => {
			if (!(await canAccessRoomIdAsync(roomId, userId))) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room');
			}
		}),
	);

	await Promise.all(
		roomIds.map(async (roomId) => {
			const userIds = (
				await Promise.all(
					usersSuggestedGroupKeys[roomId].map(async (user) => {
						const sub = await Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { projection: { _id: 1 } });

						if (!sub) {
							return;
						}

						await Subscriptions.setGroupE2ESuggestedKey(sub._id, user.key);

						return user._id;
					}),
				)
			).filter(isTruthy);

			await Rooms.removeUsersFromE2EEQueueByRoomIds([roomId], userIds);
		}),
	);
};
