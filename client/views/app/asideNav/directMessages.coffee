Template.directMessages.helpers
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), t: { $in: ['d']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }
