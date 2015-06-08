Meteor.methods
	createPrivateGroup: (name, members) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createPrivateGroup -> Invalid user"

		console.log '[methods] createPrivateGroup -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		now = new Date()

		members.push Meteor.user().username

		name = s.slugify name

		# create new room
		rid = ChatRoom.insert
			usernames: members
			ts: now
			t: 'p'
			u:
				_id: Meteor.userId()
				username: Meteor.user().username
			name: name
			msgs: 0

		for username in members
			member = Meteor.users.findOne({username: username})
			if not member?
				continue

			sub =
				u:
					_id: member._id
					username: username
				rid: rid
				ts: now
				name: name
				t: 'p'
				unread: 0

			if username is Meteor.user().username
				sub.ls = now

			ChatSubscription.insert sub

		return {
			rid: rid
		}
