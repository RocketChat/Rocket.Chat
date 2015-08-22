Meteor.methods
	createChannel: (displayName, members) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createChannel -> Invalid user"

		###
		if not /^[0-9a-z-_]+$/i.test name
			throw new Meteor.Error 'name-invalid'
		###

		console.log '[methods] createChannel -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		now = new Date()
		user = Meteor.user()

		members.push user.username

		slugName = s.slugify displayName

		# avoid duplicate names
		if ChatRoom.findOne({name:slugName})
			throw new Meteor.Error 'duplicate-name'


		room =
			usernames: members
			ts: now
			t: 'c'
			name: slugName
			displayName: displayName
			msgs: 0
			u:
				_id: Meteor.userId()
				username: user.username

		RocketChat.callbacks.run 'beforeCreateChannel', user, room

		# create new room
		rid = ChatRoom.insert room

		for username in members
			member = Meteor.users.findOne({username: username})
			if not member?
				continue

			sub =
				rid: rid
				ts: now
				name: slugName
				displayName : displayName
				t: 'c'
				unread: 0
				u:
					_id: member._id
					username: username

			if username is user.username
				sub.ls = now
				sub.open = true

			ChatSubscription.insert sub

		Meteor.defer ->

			RocketChat.callbacks.run 'afterCreateChannel', user, room

		return {
			rid: rid
		}
