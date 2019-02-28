import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { ChatRoom } from 'meteor/rocketchat:models';
import { roomTypes } from 'meteor/rocketchat:utils';

FlowRouter.goToRoomById = (roomId) => {
	const room = ChatRoom.findOne({ _id: roomId });
	if (room) {
		roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
	} else {
		// no cache hit => verify, that the rooms is server-side not existing/accessible for the user
		Meteor.call('getRoomNameAndTypeByNameOrId', roomId, (err, room) => {
			if (!err) {
				roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
			}
		});
	}
};
