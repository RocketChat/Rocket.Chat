import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { Messages, Subscriptions } from '../../../models/server';

export const unarchiveRoom = async function (rid: string): Promise<void> {
	await Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
	Messages.createRoomUnarchivedByRoomIdAndUser(rid, await Meteor.userAsync());
};
