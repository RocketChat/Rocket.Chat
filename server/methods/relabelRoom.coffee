Meteor.methods
	relabelRoom: (roomId, accessPermissionIds) ->

		console.log '[methods] relabelRoom -> '.green, 'current user:', this.userId, 'roomId: ', roomId, ' accessPermissionIds:', accessPermissionIds

		# for security, no anonymous users
		unless Meteor.userId()
			console.log '[methods] relabelRoom -> '.red, 'No logged in user'
			throw new Meteor.Error 'not-logged-user', "[methods] relabelRoom -> No anonymous user requests"

		# require room id
		unless roomId
			console.log '[methods] relabelRoom -> '.red, 'Missing room id'
			throw new Meteor.Error 'invalid-arguments', "[methods] relabelRoom -> room identifier not specified"

		# require one or more resource permission 
		unless accessPermissionIds?.length > 0
			console.log '[methods] relabelRoom -> '.red, 'Missing resource permissions'
			throw new Meteor.Error 'invalid-arguments', "[methods] relabelRoom -> Access Permission Ids not specified"

		# check access permission ids are valid
		newPermissions = new Jedis.AccessPermission(accessPermissionIds)
		unless accessPermissionIds.length is newPermissions.toArray().length
			console.log '[methods] relabelRoom -> '.red, 'Invalid access permission id'
			throw new Meteor.Error 'invalid-arguments', "[methods] relabelRoom -> Received invalid access permission id"

		# validate room exists
		room = ChatRoom.findOne({_id: roomId})
		unless room
			console.log '[methods] relabelRoom -> '.red, 'Invalid room id'
			throw new Meteor.Error 'invalid-arguments', "[methods] relabelRoom -> Invalid room id"

		# only private groups and direct message room have labels
		unless room.t in ['p', 'd']
			console.log '[methods] relabelRoom -> '.red, 'Invalid room type'
			throw new Meteor.Error 'invalid-arguments', "[methods] relabelRoom -> Invalid room type. Only private groups and direct message rooms can be labeled"

		# only room members can relabel
		unless Meteor.userId() in room.usernames
			console.log '[methods] relabelRoom -> '.red, 'Only room members can relabel a room'
			throw new Meteor.Error 'relabel-invalid-user', "[methods] relabelRoom -> Current user is not a room member and does not have permission to relabel the room"

		# validate new permissions have classification and required Release Caveat permission(s)
		unless Jedis.securityLabelIsValid( accessPermissionIds ) 
			console.log '[methods] relabelRoom -> '.red, 'New access permissions are invalid.  Either too many classifications or missing required permissions'
			throw new Meteor.Error('invalid-access-permissions', "Invalid access permissions.  Requires one classification and the system country code.")

		# validate current user has the permissions they are trying to assign except for Release Caveat
		# because user can assign ANY Release Caveat value.
		currentUserPermissions = new Jedis.AccessPermission(Meteor.user().profile?.access)
		unless currentUserPermissions.containsAll(newPermissions.getPermissionIds(['SAP','SCI','classification']))
			console.log '[methods] relabelRoom -> '.red, 'Current user trying to assign permission(s) they do not have access to'
			throw new Meteor.Error('invalid-access-permissions', "Current user does not have access to specified permission(s)")

		# validate room owner still has access
		if room.t is 'p'
			creator = Meteor.users.findOne({_id:room.u._id})
			creatorPermissions = new Jedis.AccessPermission( creator?.profile.access )
			unless creatorPermissions.canAccessResource( newPermissions ).canAccess
				console.log '[methods] relabelRoom -> '.red, 'Creator not able to access room with new permissions'
				throw new Meteor.Error('invalid-access-permissions', "Creator will not have access to room")


		roomPermissions = new Jedis.AccessPermission(room.accessPermissions)

		# check that existing SAP, SCI, RELTO permissions have not been removed
		unless newPermissions.containsAll( roomPermissions.getPermissionIds(['SAP','SCI', 'Release Caveat']))
			console.log '[methods] relabelRoom -> '.red, 'Removing existing SAP, SCI and Release Caveat room labels is not allowed'
			throw new Meteor.Error 'relabel-remove-permissions', "[methods] relabelRoom -> Removing SAP, SCI, Release Caveat permissions from a room is not allowed"

		# check that the classification has not been downgraded
		newClassificationId = newPermissions.getPermissionIds('classification')?[0]
		existingClassificationId = roomPermissions.getPermissionIds('classification')?[0]
		unless newClassificationId is existingClassificationId
			# classification changed so compare
			classificationPrecedence = Jedis.accessManager.getClassificationOrder()
			newPriority = _.indexOf(classificationPrecedence, newClassificationId)
			existingPriority = _.indexOf(classificationPrecedence, existingClassificationId)

			# this should never happen because we already verified that the permissions were valid, but check just in case 
			if newPriority is -1 or existingPriority is -1
				console.log '[methods] relabelRoom -> '.red, 'Classification not found when attempting to determine classification order.'
				throw new Meteor.Error 'invalid-classification', "[methods] relabelRoom -> Invalid classification"

			if newPriority < existingPriority
				console.log '[methods] relabelRoom -> '.red, 'Classification downgraded'
				throw new Meteor.Error 'invalid-classification', "[methods] relabelRoom -> Classification cannot be downgraded"

		# whew, finally update the room with new permissions
		ChatRoom.update( {_id: room._id}, {$set: {accessPermissions : accessPermissionIds}} )
		console.log '[methods] relabelRoom -> '.green, 'Relabeled room: ', roomId, ' new permissions: ', accessPermissionIds

		return ChatRoom.findOne({_id: room._id})
