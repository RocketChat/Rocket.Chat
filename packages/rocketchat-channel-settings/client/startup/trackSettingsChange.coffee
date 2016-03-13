Meteor.startup ->
	roomSettingsChangedCallback = (msg) ->
		Tracker.nonreactive ->
			if msg.t is 'room_changed_privacy'
				if Session.get('openedRoom') is msg.rid
					type = if FlowRouter.current().route.name is 'channel' then 'c' else 'p'
					RoomManager.close type + FlowRouter.getParam('name')

					subscription = ChatSubscription.findOne({ rid: msg.rid })
					route = if subscription.t is 'c' then 'channel' else 'group'
					FlowRouter.go route, name: subscription.name

		return msg

	RocketChat.callbacks.add 'streamMessage', roomSettingsChangedCallback, RocketChat.callbacks.priority.HIGH

	roomNameChangedCallback = (msg) ->
		Tracker.nonreactive ->
			if msg.t is 'r'
				if Session.get('openedRoom') is msg.rid
					type = if FlowRouter.current().route.name is 'channel' then 'c' else 'p'
					RoomManager.close type + FlowRouter.getParam('name')
					FlowRouter.go FlowRouter.current().route.name, name: msg.msg

		return msg

	RocketChat.callbacks.add 'streamMessage', roomNameChangedCallback, RocketChat.callbacks.priority.HIGH
