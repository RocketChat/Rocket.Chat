Meteor.methods
	createChannel: (name, members) ->
		if not /^[0-9a-z-_]+$/i.test name
			throw new Meteor.Error 'name-invalid'

		fromId = Meteor.userId()
		# console.log '[methods] createChannel -> '.green, 'fromId:', fromId, 'members:', members

		now = new Date()

		members.push Meteor.user().username

		# name = s.slugify name

		# create new room
		roomId = ChatRoom.insert
			usernames: members
			ts: now
			t: 'c'
			name: name
			msgs: 0
			u:
				_id: Meteor.userId()
				username: Meteor.user().username

		for username in members
			member = Meteor.users.findOne({username: username})
			if not member?
				continue

			sub =
				rid: roomId
				ts: now
				name: name
				t: 'c'
				unread: 0
				u:
					_id: member._id
					username: username

			if username is Meteor.user().username
				sub.ls = now

			ChatSubscription.insert sub

		return {
			rid: roomId
		}
