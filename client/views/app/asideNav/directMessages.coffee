Template.directMessages.helpers
	rooms: ->
		return ChatSubscription.find { uid: Meteor.userId(), t: { $in: ['d']}, f: { $ne: true } }, { sort: 'rn': 1 }
