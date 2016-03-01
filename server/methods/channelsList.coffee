Meteor.methods
	channelsList: (filter, sort) ->
		if filter
			return { channels: RocketChat.models.Rooms.findByNameContainingAndTypes(filter, ['c'], { sort: { name: 1 } }).fetch() }
		else
			return { channels: RocketChat.models.Rooms.findByTypeAndArchivationState('c', false, { sort: { msgs:-1 } }).fetch() }
