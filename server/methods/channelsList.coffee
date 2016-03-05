Meteor.methods
	channelsList: (filter, limit) ->
		options =  { fields: { name: 1 }, sort: { msgs:-1 } }
		if _.isNumber limit
			options.limit = limit

		if filter
			options.sort = { name: 1 }
			return { channels: RocketChat.models.Rooms.findByNameContainingAndTypes(filter, ['c'], options).fetch() }
		else
			return { channels: RocketChat.models.Rooms.findByTypeAndArchivationState('c', false, options).fetch() }
