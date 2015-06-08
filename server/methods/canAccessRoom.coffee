Meteor.methods
	canAccessRoom: (rid, userId) ->
		console.log '[methods] canAccessRoom -> '.green, 'userId:', userId, 'rid:', rid

		user = Meteor.users.findOne userId, fields: username: 1

		# user = Meteor.user()
		unless user?.username
			throw new Meteor.Error 'not-logged-user', "[methods] canAccessRoom -> User doesn't have enough permissions"

		unless rid
			throw new Meteor.Error 'invalid-room', '[methods] canAccessRoom -> Cannot access empty room'

		room = ChatRoom.findOne rid, { fields: { usernames: 1, t: 1 } }

		if room.t is 'c'
			canAccess = true
		else if room.usernames.indexOf(user.username) isnt -1
			canAccess = true

		if canAccess isnt true
			throw new Meteor.Error 'without-permission', "[methods] canAccessRoom -> User doesn't have enough permissions"
			return false
		else
			return room

		# # create room subscription
		# ChatSubscription.upsert { rid: rid, $and: [{'u._id': Meteor.userId()}] },
		# 	$setOnInsert:
		# 		'u._id': Meteor.userId()
		# 		name: room.name
		# 		t: room.t
		# 		unread: 0
		# 	$set:
		# 		ls: (new Date())
		# 		ts: (new Date())
