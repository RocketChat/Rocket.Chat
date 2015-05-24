Meteor.methods
	createGroupRoom: (users, newUser) ->
		fromId = Meteor.userId()
		console.log '[methods] createGroupRoom -> '.green, 'fromId:', fromId, 'users:', users, 'newUser:', newUser

		if Meteor.userId() is newUser
			return

		now = new Date()

		users.push newUser

		usersName = []

		Meteor.users.find({ _id: { $in: users } }, { fields: { name: 1 }, sort: { name: 1 } }).forEach (user) ->
			usersName.push user.name

		roomName = usersName.join ', '

		# create new room
		roomId = ChatRoom.insert
			uids: users
			ts: now
			t: 'g'
			uid: Meteor.userId()
			name: roomName
			msgs: 0

		for user in users
			sub =
				uid: user
				rid: roomId
				ts: now
				rn: roomName
				t: 'g'
				unread: 0

			if user is Meteor.userId()
				sub.ls = now

			ChatSubscription.insert sub

		return {
			rid: roomId
		}
