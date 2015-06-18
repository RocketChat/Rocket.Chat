Meteor.methods
	joinRoom: (rid) ->

		room = ChatRoom.findOne rid

		if room.t isnt 'c'
			throw new Meteor.Error 403, '[methods] joinRoom -> Not allowed'

		# verify if user is already in room
		# if room.usernames.indexOf(user.username) is -1

		now = new Date()

		user = Meteor.users.findOne Meteor.userId()

		update =
			$push:
				usernames:
					$each: [user.username]
					$sort: 1

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

		return true
