Template.directMessages.helpers
	rooms: ->
		return ChatSubscription.find { t: { $in: ['d']}, f: { $ne: true } }, { sort: 't': 1, 'name': 1 }
