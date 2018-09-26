FlowRouter.goToRoomById = (roomId) => {
	const room = ChatRoom.findOne({_id: roomId});
	if (room) {
		RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
	} else {
		Meteor.call('getRoomNameAndTypeByNameOrId', roomId, (err, room)=>{
			if (!err) {
				RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
			}
		});
	}
};
