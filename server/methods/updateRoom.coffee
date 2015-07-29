Meteor.methods
	updateRoom: (rid, name, users, accessPermissions) ->

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateRoom -> Invalid user")

		room = ChatRoom.findOne rid

		if room.t not in ['d'] and name? and name isnt room.name
			Meteor.call 'saveRoomName', rid, name
		Meteor.call 'relabelRoom', rid, accessPermissions
		if users?
			# remove the current users
			users = _.without.apply _,room.usernames.concat users
			for user in users
				Meteor.call 'addUserToRoom', rid, user
		return true
