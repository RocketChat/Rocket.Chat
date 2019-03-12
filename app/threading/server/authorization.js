import { Meteor } from 'meteor/meteor';
import { addRoomAccessValidator, canAccessRoom } from '/app/authorization';
import { Rooms } from '/app/models';

Meteor.startup(() => {
	addRoomAccessValidator(function(room, user) {
		return room.prid && canAccessRoom(Rooms.findOne(room.prid), user);
	});
});
