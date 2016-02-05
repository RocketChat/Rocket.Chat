Meteor.methods
	channelsList: ->
		return { channels: RocketChat.models.Rooms.findByTypeAndArchivationState('c', false, { sort: { msgs:-1 } }).fetch() }
