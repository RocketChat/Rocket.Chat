FlowRouter.route '/channel/:name',
	name: 'channel'

	action: (params, queryParams) ->
		Session.set 'showUserInfo'
		openRoom 'c', params.name

	triggersExit: [roomExit]


FlowRouter.route '/group/:name',
	name: 'group'

	action: (params, queryParams) ->
		Session.set 'showUserInfo'
		openRoom 'p', params.name

	triggersExit: [roomExit]


FlowRouter.route '/direct/:username',
	name: 'direct'

	action: (params, queryParams) ->
		Session.set 'showUserInfo', params.username
		openRoom 'd', params.username

	triggersExit: [roomExit]


FlowRouter.goToRoomById = (roomId) ->
	subscription = ChatSubscription.findOne({rid: roomId})
	if subscription?
		switch subscription.t
			when 'c'
				FlowRouter.go 'channel', {name: subscription.name}

			when 'p'
				FlowRouter.go 'group', {name: subscription.name}

			when 'd'
				FlowRouter.go 'direct', {username: subscription.name}
