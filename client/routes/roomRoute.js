FlowRouter.goToRoomById = (roomId) => {
	const subscription = ChatSubscription.findOne({rid: roomId});
	if (subscription) {
		FlowRouter.go(RocketChat.roomTypes.getRouteLink(subscription.t, subscription), null, FlowRouter.current().queryParams);
	}
};
