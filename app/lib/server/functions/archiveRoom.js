import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';

export const archiveRoom = function(rid) {
	Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);

	callbacks.run('afterRoomArchived', Rooms.findOneById(rid), Meteor.user());
};
