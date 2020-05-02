import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/client';

export const getUidDirectMessage = (rid, userId = Meteor.userId()) => {
	const room = Rooms.findOne({ _id: rid }, { fields: { uids: 1 } });

	if (!room || !room.uids || room.uids.length > 2) {
		return false;
	}

	const other = room && room.uids.filter((uid) => uid !== userId);

	return other && other[0];
};
