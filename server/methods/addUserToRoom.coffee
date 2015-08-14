Meteor.methods
	addUserToRoom: (data) ->
		fromId = Meteor.userId()
		console.log '[methods] addUserToRoom -> '.green, 'executor:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		# if room.username isnt Meteor.user().username and room.t is 'c'
		if room.u.username isnt Meteor.user().username and room.t is 'c'
			throw new Meteor.Error 403, '[methods] addUserToRoom -> Not allowed'

		# verify if user is already in room
		if room.usernames.indexOf(data.username) isnt -1
			return

		# verify user to add satisfies MAC restrictions.  Only pertains to private group
		if room.t is 'p'
			# chat-locker reuses the username for the _id
			result = Meteor.call 'canAccessResource', [data.username], room.accessPermissions
			unless result.canAccess
				console.log '[methods] addUserToRoom -> '.red, 'User cannot be added because they have insufficient access'
				throw new Meteor.Error 'insufficient-access', '[methods] addUserToRoom -> user has insufficient access'

		now = new Date()

		update =
			$addToSet:
				usernames: data.username

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
				_id: fromId
				username: Meteor.user().username

		return true
