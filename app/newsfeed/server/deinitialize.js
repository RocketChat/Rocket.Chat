// import { Meteor } from 'meteor/meteor';
//
// import { settings } from '../../settings';
import { deleteRoom } from '../../lib/server/functions';
import { Rooms, Users } from '../../models';

function deinitializeNewsfeed() {
	const roomList = Rooms.findByType('n').fetch();
	roomList.forEach((room) => {
		deleteRoom(room._id);
	});
	Users.update({}, { $unset: { followers: 1 } }, { multi: true });
	Users.update({}, { $unset: { following: 1 } }, { multi: true });
}

export { deinitializeNewsfeed };
