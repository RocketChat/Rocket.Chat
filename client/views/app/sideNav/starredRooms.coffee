Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { f: true }, { sort: 't': 1, 'name': 1, open: true }
	total: ->
		return ChatSubscription.find({ f: true }).count()
	isActive: ->
		return 'active' if ChatSubscription.findOne({ f: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?
