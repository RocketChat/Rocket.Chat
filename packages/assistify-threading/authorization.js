import { Meteor } from 'meteor/meteor';
import { addRoomAccessValidator, canAccessRoom } from 'meteor/rocketchat:authorization';
import { Rooms } from 'meteor/rocketchat:models';

Meteor.startup(() => {
	addRoomAccessValidator(function(room, user) {
		return room.prid && canAccessRoom(Rooms.findOne(room.prid), user);
	});
});
