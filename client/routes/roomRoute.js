import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.goToRoomById = (roomId) => {
	const room = ChatRoom.findOne({_id: roomId});
	if (room) {
		RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
	} else {
		// no cache hit => verify, that the rooms is really not exsiting/accessible for the user
		Meteor.call('getRoomNameAndTypeByNameOrId', roomId, (err, room)=>{
			if (!err) {
				RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
			}
		});
	}
};
