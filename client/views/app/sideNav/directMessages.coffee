Template.directMessages.helpers
	rooms: ->
		return ChatSubscription.find { 'u._id': Meteor.userId(), t: { $in: ['d']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }
	total: ->
		return ChatSubscription.find({ 'u._id': Meteor.userId(), t: { $in: ['d']}, f: { $ne: true } }, { sort: 't': 1, 'rn': 1 }).fetch().length
