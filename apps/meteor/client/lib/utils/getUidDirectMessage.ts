import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../app/models/client';

export const getUidDirectMessage = (rid: IRoom['_id'], uid: IUser['_id'] | null = Meteor.userId()): string | undefined => {
	const room = Rooms.state.get(rid);

	if (!room || room.t !== 'd' || !room.uids || room.uids.length > 2) {
		return undefined;
	}

	return room.uids.filter((_uid) => _uid !== uid)[0];
};
