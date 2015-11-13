Meteor.startup ->
	roomNameChangedCallback = (msg) ->
		Tracker.nonreactive ->
			if msg.t is 'r'
				if Session.get('openedRoom') is msg.rid
					type = if FlowRouter.current().route.name is 'channel' then 'c' else 'p'
					RoomManager.close type + FlowRouter.getParam('name')
					FlowRouter.go FlowRouter.current().route.name, name: msg.msg

		return msg

	RocketChat.callbacks.add 'streamMessage', roomNameChangedCallback, RocketChat.callbacks.priority.HIGH
