Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), f: true }, { sort: 't': 1, 'rn': 1 }
