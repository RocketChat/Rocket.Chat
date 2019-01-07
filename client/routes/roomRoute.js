import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';

FlowRouter.goToRoomById = (roomId) => {
	const room = ChatRoom.findOne({ _id: roomId });
	if (room) {
		RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
	} else {
		// no cache hit => verify, that the rooms is server-side not existing/accessible for the user
		Meteor.call('getRoomNameAndTypeByNameOrId', roomId, (err, room) => {
			if (!err) {
				RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
			}
		});
	}
};
