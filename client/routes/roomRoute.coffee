FlowRouter.goToRoomById = (roomId) ->
	subscription = ChatSubscription.findOne({rid: roomId})
	if subscription?
		FlowRouter.go RocketChat.roomTypes.getRouteLink subscription.t, subscription
