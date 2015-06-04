Meteor.methods
	createChannel: (name, members) ->
		if not /^[0-9a-z-_]+$/i.test name
			throw new Meteor.Error 'name-invalid'

		fromId = Meteor.userId()
		# console.log '[methods] createChannel -> '.green, 'fromId:', fromId, 'members:', members

		now = new Date()

		members.push Meteor.userId()

		# name = s.slugify name

		# create new room
		roomId = ChatRoom.insert
			uids: members
			ts: now
			t: 'c'
			uid: Meteor.userId()
			name: name
			msgs: 0

		for user in members
			sub =
				uid: user
				rid: roomId
				ts: now
				rn: name
				t: 'c'
				unread: 0

			if user is Meteor.userId()
				sub.ls = now

			ChatSubscription.insert sub

		return {
			rid: roomId
		}
