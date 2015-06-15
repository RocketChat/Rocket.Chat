Meteor.methods
	joinRoom: (rid) ->

		room = ChatRoom.findOne rid

		if room.t isnt 'c'
			throw new Meteor.Error 403, '[methods] joinRoom -> Not allowed'

		# verify if user is already in room
		# if room.usernames.indexOf(data.username) is -1

		now = new Date()

		update =
			$push:
				usernames:
					$each: [data.username]
					$sort: 1

		newUser = Meteor.users.findOne username: data.username

		ChatRoom.update data.rid, update

		ChatSubscription.insert
			rid: data.rid
			ts: now
			name: room.name
			t: room.t
			open: true
			alert: true
			unread: 1
			u:
				_id: newUser._id
				username: data.username

		ChatMessage.insert
			rid: data.rid
			ts: now
			t: 'au'
			msg: newUser.name
			u:
				_id: newUser._id
				username: data.username

		return true
