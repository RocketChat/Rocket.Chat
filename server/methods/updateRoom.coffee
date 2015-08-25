Meteor.methods
	updateRoom: (rid, displayName, usernames=[], accessPermissions) ->

		console.log '[method] updateRoom -> arguments', arguments

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateRoom -> Requires authenticated user")

		# validate params exist
		unless rid and accessPermissions
			throw new Meteor.Error 'invalid-argument', 'Missing required values'

		room = ChatRoom.findOne rid
		usernames.push Meteor.user().username

		unless room
			throw new Meteor.Error 'invalid-argument', 'Room to update not found'

		# private groups only:
		if room.t is 'p'
			# ensure name is specified and the owner is a member
			unless displayName
				throw new Meteor.Error 'invalid-argument', 'Missing room name'
			unless room.u.username in usernames
				throw new Meteor.Error 'invalid-argument', 'You cannot remove the room creator'



		# make access check to see if users have all specified permissions
		result = Meteor.call 'canAccessResource', usernames, accessPermissions
		deniedUserList = _.pluck result.deniedUsers, 'user'


		# make sure current user can access the new permissions
		# should never be possible in GUI, but still must protect on back-end
		if _.contains deniedUserList, Meteor.user().username
			throw new Meteor.Error 'invalid-access-permissions', 'Current user cannot participate in the conversation with the specified access permissions.'


		# for direct messages, do not allow relabel if the other party can't access
		if room.t is 'd'
			unless result.canAccess
				throw new Meteor.Error 'invalid-access-permissions', 'User ' + deniedUserList.join(', ') + ' cannot participate in the direct message with the specified access permissions. Room not relabeled.'
		

		# relabel room if permissions changed
		# perform relabel AFTER access check for direct message because dm cannot be relabeled to kick other participant
		# make sure to relabel BEFORE adding users to a private group because the 'addUserToRoom' method performs access check
		if _.difference( accessPermissions, room.accessPermissions ).length > 0
			Meteor.call 'relabelRoom', rid, accessPermissions


		# for private groups, if any users don't have the permissions, exclude/kick them
		if room.t is 'p'

			# update the room name, if changed
			if displayName isnt room.displayName
				Meteor.call 'saveRoomName', rid, displayName

			# remove users from the room - those removed explicitly, and those kicked due to permission conflict
			usersRemoved = _.difference( room.usernames, usernames )
			usersKicked =  _.intersection( room.usernames, deniedUserList )
			usersToRemove = _.uniq(usersRemoved.concat(usersKicked))
			for username in usersToRemove
				Meteor.call 'removeUserFromRoom', {rid: rid, username: username}


			# add users to the room - of those specified, only add those that have the right permissions
			usersToAdd = _.difference( usernames, room.usernames )
			usersToAdd = _.difference( usersToAdd, deniedUserList )
			for userdisplayName in usersToAdd
				Meteor.call 'addUserToRoom', {rid: rid, username: username}
		

		slugName = ChatRoom.findOne({_id:rid})?.name


		return {rid:rid, name:displayName, slugName:slugName}
