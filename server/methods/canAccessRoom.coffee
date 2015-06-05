Meteor.methods
	canAccessRoom: (roomId) ->
		fromId = Meteor.userId()
		# console.log '[methods] canAccessRoom -> '.green, 'fromId:', fromId, 'roomId:', roomId

		user = Meteor.user()
		unless user?
			throw new Meteor.Error 'not-logged-user', "[methods] canAccessRoom -> User doesn't have enough permissions"

		unless roomId
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Cannot access empty room'

		room = ChatRoom.findOne roomId

		canAccess = false

		if room.t is 'c'
			canAccess = true
		else if room.usernames.indexOf(Meteor.user().username) isnt -1
			canAccess = true

		if canAccess isnt true
			throw new Meteor.Error 'without-permission', "[methods] canAccessRoom -> User doesn't have enough permissions"

		# create room subscription
		ChatSubscription.upsert { rid: roomId, $and: [{'u._id': Meteor.userId()}] },
			$setOnInsert:
				'u._id': Meteor.userId()
				rn: room.name
				t: room.t
				unread: 0
				mentions: 0
			$set:
				ls: (new Date())
				ts: (new Date())

		return true
