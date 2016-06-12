Meteor.methods
	channelsList: (filter, limit, sort) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'channelsList' }

		options =  { fields: { name: 1, t: 1 }, sort: { msgs:-1 } }
		if _.isNumber limit
			options.limit = limit
		if _.trim(sort)
			switch sort
				when 'name'
					options.sort = { name: 1 }
				when 'msgs'
					options.sort = { msgs: -1 }

		roomTypes = []
		if RocketChat.authz.hasPermission Meteor.userId(), 'view-c-room'
			roomTypes.push {type: 'c'}
		else if RocketChat.authz.hasPermission Meteor.userId(), 'view-joined-room'
			roomIds = _.pluck RocketChat.models.Subscriptions.findByTypeAndUserId('c', Meteor.userId()).fetch(), 'rid'
			roomTypes.push {type: 'c', ids: roomIds}
		if (RocketChat.authz.hasPermission Meteor.userId(), 'view-p-room') and
			RocketChat.settings.get('UI_Merge_Channels_Groups')
				roomTypes.push {type: 'p', username: Meteor.user().username}

		if roomTypes.length
			if filter
				return { channels: RocketChat.models.Rooms.findByNameContainingTypesWithUsername(filter, roomTypes, options).fetch() }
			else
				return { channels: RocketChat.models.Rooms.findContainingTypesWithUsername(roomTypes, options).fetch() }
		else
			return { channels: [] }
