Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), f: true }, { sort: 't': 1, 'rn': 1 }
	total: ->
		return ChatSubscription.find({ uid: Meteor.userId(), f: true }, { sort: 't': 1, 'rn': 1 }).fetch().length