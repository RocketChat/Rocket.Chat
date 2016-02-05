Meteor.startup ->
	RocketChat.roomTypes.setPublish 'c', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
				topic: 1
				muted: 1
				archived: 1

		return RocketChat.models.Rooms.findByTypeAndName 'c', identifier, options

	RocketChat.roomTypes.setPublish 'p', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
				topic: 1
				muted: 1
				archived: 1

		user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
		return RocketChat.models.Rooms.findByTypeAndNameContainigUsername 'p', identifier, user.username, options

	RocketChat.roomTypes.setPublish 'd', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
				topic: 1
		user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
		return RocketChat.models.Rooms.findByTypeContainigUsernames 'd', [user.username, identifier], options
