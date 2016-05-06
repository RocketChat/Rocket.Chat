Meteor.methods
	channelsList: (filter, limit, sort) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'channelsList' }

		options =  { fields: { name: 1 }, sort: { msgs:-1 } }
		if _.isNumber limit
			options.limit = limit
		if _.trim(sort)
			switch sort
				when 'name'
					options.sort = { name: 1 }
				when 'msgs'
					options.sort = { msgs: -1 }

		if filter
			return { channels: RocketChat.models.Rooms.findByNameContainingAndTypes(filter, ['c'], options).fetch() }
		else
			return { channels: RocketChat.models.Rooms.findByTypeAndArchivationState('c', false, options).fetch() }
