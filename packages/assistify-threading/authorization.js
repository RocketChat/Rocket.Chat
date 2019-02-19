import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { addRoomAccessValidator, canAccessRoom } from 'meteor/rocketchat:authorization';
import { Rooms } from 'meteor/rocketchat:models';

Meteor.startup(() => {

	// Add permissions for threading
	const permissions = [
		{ _id: 'start-thread', roles: ['admin', 'user', 'expert', 'guest'] },
		{ _id: 'start-thread-other-user', roles: ['admin', 'user', 'expert', 'owner'] },
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, { $set: permission });
		}
	}

	addRoomAccessValidator(function(room, user) {
		return room.prid && canAccessRoom(Rooms.findOne(room.prid), user);
	});
});
