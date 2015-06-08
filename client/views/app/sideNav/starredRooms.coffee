Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { f: true }, { sort: 't': 1, 'name': 1 }
	total: ->
		return ChatSubscription.find({ f: true }).count()
