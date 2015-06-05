Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { 'u._id': Meteor.userId(), f: true }, { sort: 't': 1, 'name': 1 }
	total: ->
		return ChatSubscription.find({ 'u._id': Meteor.userId(), f: true }, { sort: 't': 1, 'name': 1 }).fetch().length
