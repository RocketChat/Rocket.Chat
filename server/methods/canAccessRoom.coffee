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

		if user.admin
			canAccess = true
		else if room.uids.indexOf(Meteor.userId()) isnt -1
			canAccess = true

		if canAccess isnt true
			throw new Meteor.Error 'without-permission', "[methods] canAccessRoom -> User doesn't have enough permissions"

		# create room subscription
		ChatSubscription.upsert { rid: roomId, uid: Meteor.userId() },
			$setOnInsert:
				rn: room.name
				t: 'v'
				unread: 0
			$set:
				ls: (new Date())
				ts: (new Date())

		return true
