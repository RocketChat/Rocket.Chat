Meteor.methods
	joinRoom: (rid) ->

		room = ChatRoom.findOne rid

		if room.t isnt 'c'
			throw new Meteor.Error 403, '[methods] joinRoom -> Not allowed'

		# verify if user is already in room
		# if room.usernames.indexOf(user.username) is -1
		console.log '[methods] joinRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		now = new Date()

		user = Meteor.users.findOne Meteor.userId()

		RocketChat.callbacks.run 'beforeJoinRoom', user, room

		update =
			$addToSet:
				usernames: user.username

		ChatRoom.update rid, update

		ChatSubscription.insert
			rid: rid
			ts: now
			name: room.name
			t: room.t
			open: true
			alert: true
			unread: 1
			u:
				_id: user._id
				username: user.username

		ChatMessage.insert
			rid: rid
			ts: now
			t: 'uj'
			msg: user.name
			u:
				_id: user._id
				username: user.username

		Meteor.defer ->

			RocketChat.callbacks.run 'afterJoinRoom', user, room

		return true
