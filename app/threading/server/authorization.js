import { Meteor } from 'meteor/meteor';
import { addRoomAccessValidator, canAccessRoom } from '../../authorization';
import { Rooms } from '../../models';

Meteor.startup(() => {
	addRoomAccessValidator(function(room, user) {
		return room && room.prid && canAccessRoom(Rooms.findOne(room.prid), user);
	});
});
