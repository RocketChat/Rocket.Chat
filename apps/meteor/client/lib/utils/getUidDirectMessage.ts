import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ChatRoom } from '../../../app/models/client';

export const getUidDirectMessage = (rid: IRoom['_id'], uid: IUser['_id'] | null = Meteor.userId()): string | undefined => {
	const room = ChatRoom.findOne({ _id: rid }, { fields: { t: 1, uids: 1 } });

	if (!room || room.t !== 'd' || !room.uids || room.uids.length > 2) {
		return undefined;
	}

	return room.uids.filter((_uid) => _uid !== uid)[0];
};
