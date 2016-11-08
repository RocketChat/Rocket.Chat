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
				ro: 1
				jitsiTimeout: 1
				description: 1
				sysMes: 1
				joinCodeRequired: 1
				details: 1

		if RocketChat.authz.hasPermission(this.userId, 'view-join-code')
			options.fields.joinCode = 1
		return RocketChat.models.Rooms.find({}, options)

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
				ro: 1
				jitsiTimeout: 1
				description: 1
				sysMes: 1
				details: 1

		return RocketChat.models.Rooms.find({}, options)
		#user = RocketChat.models.Users.findOneById this.userId, fields: username: 1
		#return RocketChat.models.Rooms.findByTypeAndNameContainingUsername 'p', identifier, user.username, options

	RocketChat.roomTypes.setPublish 'd', (identifier) ->
		options =
			fields:
				name: 1
				t: 1
				cl: 1
				u: 1
				usernames: 1
				topic: 1
				jitsiTimeout: 1
				details: 1

		return RocketChat.models.Rooms.find({}, options)
