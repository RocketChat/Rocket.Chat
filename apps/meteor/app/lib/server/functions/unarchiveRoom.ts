import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models/server';

export const unarchiveRoom = function (rid: string, roomCollectionUpdated = false): void {
	if (!roomCollectionUpdated) {
		Rooms.unarchiveById(rid);
	}
	Subscriptions.unarchiveByRoomId(rid);
	Messages.createRoomUnarchivedByRoomIdAndUser(rid, Meteor.user());
};
