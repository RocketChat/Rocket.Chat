import { Meteor } from 'meteor/meteor';

import { Rooms, Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';

export const archiveRoom = function (rid: string): void {
	Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);

	callbacks.run('afterRoomArchived', Rooms.findOneById(rid), Meteor.user());
};
