FlowRouter.goToRoomById = (roomId) => {
	const subscription = ChatSubscription.findOne({rid: roomId});
	if (subscription) {
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}
};
