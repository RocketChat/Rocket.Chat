import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';

export const archiveRoom = async function (rid: string): Promise<void> {
	Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);
	Messages.createRoomArchivedByRoomIdAndUser(rid, await Meteor.userAsync());

	callbacks.run('afterRoomArchived', Rooms.findOneById(rid), await Meteor.userAsync());
};
