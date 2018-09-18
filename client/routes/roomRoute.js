FlowRouter.goToRoomById = (roomId) => {
	const subscription = ChatSubscription.findOne({ rid: roomId });
	if (subscription) {
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	} else {
		const room = ChatRoom.findOne({ _id: roomId });
		if (room) {
			RocketChat.roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
		}
	}
};
