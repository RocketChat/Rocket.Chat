Meteor.methods
	updateRoom: (rid, name, usernames, accessPermissions) ->

		console.log '[method] updateRoom -> arguments', arguments

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateRoom -> Requires authenticated user")

		# validate params exist
		unless name and accessPermissions
			throw new Meteor.Error 'invalid-argument', 'Missing required values'

		room = ChatRoom.findOne rid

		# don't allow the room creator to be removed
		if room.u?
			unless room.u.username in usernames
				throw new Meteor.Error 'invalid-argument', 'You cannot remove the room creator'

		if room.t not in ['d'] and name? and name isnt room.name
			Meteor.call 'saveRoomName', rid, name

		# relabel room if permissions changed
		if _.difference( accessPermissions, room.accessPermissions ).length > 0
			Meteor.call 'relabelRoom', rid, accessPermissions

		# only modify room membership for private groups - not direct messages
		if room.t is 'p'
			# add users to the room that weren't previously in the room
			usersToAdd = _.difference( usernames, room.usernames)
			for username in usersToAdd
				Meteor.call 'addUserToRoom', {rid: rid, username: username}

			# remove users from the room that were previously in the room
			usersToRemove = _.difference( room.usernames, usernames)
			for username in usersToRemove
				Meteor.call 'removeUserFromRoom', {rid: rid, username: username}

		return {rid:rid}
