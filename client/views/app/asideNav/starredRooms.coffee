Template.starredRooms.helpers
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), f: true }, { sort: 'rn': 1 }
