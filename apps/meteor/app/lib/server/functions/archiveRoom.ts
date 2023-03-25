import { Meteor } from 'meteor/meteor';
import { Rooms } from '@rocket.chat/models';

import { Messages, Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';

export const archiveRoom = async function (rid: string): Promise<void> {
	await Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);
	Messages.createRoomArchivedByRoomIdAndUser(rid, await Meteor.userAsync());

	callbacks.run('afterRoomArchived', await Rooms.findOneById(rid), await Meteor.userAsync());
};
