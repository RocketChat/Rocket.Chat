Meteor.methods
	addUserToRoom: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] addUserToRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.uid isnt Meteor.userId() and room.t is 'c'
			throw new Meteor.Error 403, '[methods] addUserToRoom -> Not allowed'

		# verify if user is already in room
		if room.uids.indexOf(data.uid) isnt -1
			return

		update =
			$addToSet:
				uids: data.uid

		newUser = Meteor.users.findOne data.uid

		ChatRoom.update data.rid, update

		ChatSubscription.insert
			uid: data.uid
			rid: data.rid
			ts: (new Date())
			rn: room.name
			t: room.t
			unread: 0

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'au'
			msg: newUser.name
			by: Meteor.userId()

		return true
