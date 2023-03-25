import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { Messages, Subscriptions } from '../../../models/server';

export const unarchiveRoom = async function (rid: string) {
	await Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
	Messages.createRoomUnarchivedByRoomIdAndUser(rid, Meteor.user());
};
