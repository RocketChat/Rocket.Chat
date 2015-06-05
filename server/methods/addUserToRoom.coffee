Meteor.methods
	addUserToRoom: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] addUserToRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.username isnt Meteor.user().username and room.t is 'c'
			throw new Meteor.Error 403, '[methods] addUserToRoom -> Not allowed'

		# verify if user is already in room
		if room.usernames.indexOf(data.username) isnt -1
			return

		update =
			$push:
				usernames:
					$each: [data.username]
					$sort: 1

		newUser = Meteor.users.findOne username: data.username

		ChatRoom.update data.rid, update

		ChatSubscription.insert
			u:
				_id: newUser._id
				username: data.username
			rid: data.rid
			ts: (new Date())
			rn: room.name
			t: room.t
			unread: 0
			mentions: 0

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'au'
			msg: newUser.name
			by: Meteor.userId()

		return true
