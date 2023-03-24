import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models/server';

export const unarchiveRoom = async function (rid: string): Promise<void> {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
	Messages.createRoomUnarchivedByRoomIdAndUser(rid, await Meteor.userAsync());
};
