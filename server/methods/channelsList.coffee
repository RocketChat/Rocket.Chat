Meteor.methods
	channelsList: (limit) ->
		options =  { sort: { msgs:-1 } }
		if _.isNumber limit
			options.limit = limit

		return { channels: RocketChat.models.Rooms.findByTypeAndArchivationState('c', false, options).fetch() }
