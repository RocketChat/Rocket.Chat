import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomId } from '../../../lib/server/lib/notifyListener';

export const saveRoomCategory = async function (rid: string, roomCategory: string | undefined, _user: IUser): Promise<UpdateResult> {
	if (!rid || typeof rid !== 'string') {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomCategory',
		});
	}

	const result = await Rooms.setCategoryById(rid, roomCategory?.trim() || undefined);
	await notifyOnSubscriptionChangedByRoomId(rid);
	return result;
};