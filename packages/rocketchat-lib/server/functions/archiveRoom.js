import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions } from 'meteor/rocketchat:models';
import { callbacks } from 'meteor/rocketchat:callbacks';

export const archiveRoom = function(rid) {
	Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);

	callbacks.run('afterRoomArchived', Rooms.findOneById(rid), Meteor.user());
};
