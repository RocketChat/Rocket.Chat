import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomId } from '../../../lib/server/lib/notifyListener';

export const saveRoomCategoryPosition = async function (
	rid: string,
	categoryPosition: IRoom['categoryPosition'],
	_user: IUser,
): Promise<UpdateResult> {
	if (!rid || typeof rid !== 'string') {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomCategoryPosition',
		});
	}

	const result = await Rooms.setCategoryPositionById(rid, categoryPosition);
	await notifyOnSubscriptionChangedByRoomId(rid);
	return result;
};
