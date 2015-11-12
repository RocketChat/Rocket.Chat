Meteor.startup ->
	RocketChat.roomTypes.addPublish 'c', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
		return RocketChat.models.Rooms.findByTypeAndName 'c', identifier, options

	RocketChat.roomTypes.addPublish 'p', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
		user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
		return RocketChat.models.Rooms.findByTypeAndNameContainigUsername 'p', identifier, user.username, options

	RocketChat.roomTypes.addPublish 'd', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
		user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
		return RocketChat.models.Rooms.findByTypeContainigUsername 'd', user.username, options
