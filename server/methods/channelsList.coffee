Meteor.methods
	channelsList: ->
		return ChatSubscription.find({ uid: Meteor.userId(), t: 'c' }).fetch()
