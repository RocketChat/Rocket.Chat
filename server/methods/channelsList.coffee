Meteor.methods
	channelsList: ->
		return { channels: RocketChat.models.Rooms.findByType('c', { sort: { msgs:-1 } }).fetch() }
