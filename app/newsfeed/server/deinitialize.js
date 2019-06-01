// import { Meteor } from 'meteor/meteor';
//
// import { settings } from '../../settings';
import { deleteRoom } from '../../lib/server/functions';
import { Rooms } from '../../models';

function deinitializeNewsfeed() {
	const roomList = Rooms.findByType('n').fetch();
	roomList.forEach((room) => {
		deleteRoom(room._id);
	});
}

export { deinitializeNewsfeed };
