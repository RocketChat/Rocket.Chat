Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

		console.log '[methods] setUsername -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		if user.username?
			throw new Meteor.Error 'username-already-setted'

		if not usernameIsAvaliable username
			throw new Meteor.Error 'username-unavaliable'

		if not /^[0-9a-z-_.]+$/.test username
			throw new Meteor.Error 'username-invalid'

		if not user.username?
			# put user in general channel
			ChatRoom.update 'GENERAL',
				$push:
					usernames:
						$each: [username]
						$sort: 1

			if not ChatSubscription.findOne(rid: 'GENERAL', 'u._id': user._id)?
				ChatSubscription.insert
					rid: 'GENERAL'
					name: 'general'
					ts: new Date()
					t: 'c'
					f: true
					open: true
					alert: true
					unread: 1
					u:
						_id: user._id
						username: username

				ChatMessage.insert
					rid: 'GENERAL'
					ts: new Date()
					t: 'uj'
					msg: ''
					u:
						_id: user._id
						username: username

		Meteor.users.update({_id: user._id}, {$set: {username: username}})

		return username

slug = (text) ->
	text = slugify text, '.'
	return text.replace(/[^0-9a-z-_.]/g, '')

usernameIsAvaliable = (username) ->
	if username.length < 1
		return false

	return not Meteor.users.findOne({username: username})?
