Meteor.methods
	canAccessResource: (userIds, resourcePermissionIds) ->
		# check that all users have adequate permission to a resource based on 
		# its permissions
		console.log '[methods] canAccessResource -> '.green, 'current user:', this.userId, 'userIds:', userIds, 'resourcePermissionIds:', resourcePermissionIds

		# for security, no anonymous users
		unless this.userId
			console.log '[methods] canAccessResource -> '.red, 'No logged in user'
			throw new Meteor.Error 'not-logged-user', "[methods] canAccessResource -> No anonymous user requests"

		# require one or more userIds 
		unless userIds?.length > 0
			console.log '[methods] canAccessResource -> '.red, 'Missing userIds'
			throw new Meteor.Error 'invalid-arguments', "[methods] canAccessResource -> UserIds not specified"

		# require one or more resource permission 
		unless resourcePermissionIds?.length > 0
			console.log '[methods] canAccessResource -> '.red, 'Missing resource permissions'
			throw new Meteor.Error 'invalid-arguments', "[methods] canAccessResource -> Resource Permissions not specified"

		users = Meteor.users.find({_id: {$in : userIds }}).fetch()

		# check for invalid userId
		unless users?.length is userIds.length
			console.log '[methods] canAccessResource -> '.red, 'invalid user id(s)'
			throw new Meteor.Error 'invalid-arguments', "[methods] canAccessResource -> Invalid user id specified"

		# for security, current user must have ALL permissions being checked.  Otherwise, 
		# they could determine other user's permisions
		canAccess = false
		resourcePermissions = new Jedis.AccessPermission resourcePermissionIds
		if Meteor.user?().profile?.access
			userPermissions = new Jedis.AccessPermission Meteor.user().profile.access
			canAccess = userPermissions.canAccessResource(resourcePermissions).canAccess

		if canAccess is false
			console.log '[methods] canAccessResource -> '.red, 'Current user has inadequate access permission(s)'
			throw new Meteor.Error 'invalid-access', "[methods] canAccessResource -> Current user has inadequate access permission(s)"

		# find users that do NOT have access
		deniedUsers = []
		users.forEach (user) ->
			allowed = true
			failedPermIds = []

			if user?.profile?.access
				userPermissions = new Jedis.AccessPermission user.profile.access
				result = userPermissions.canAccessResource resourcePermissions
				console.log user._id
				console.log result
				allowed = result.canAccess
				failedPermIds = result.failIds

			unless allowed
				deniedUser = {}
				deniedUser[user._id] = failedPermIds
				deniedUsers.push deniedUser

		console.log deniedUsers

		###
		deniedUsers = _.filter users, (user) ->
			allowed = true
			if user?.profile?.access
				userPermissions = new Jedis.AccessPermission user.profile.access
				allowed = userPermissions.canAccessResource(resourcePermissions).canAccess   
			# exclude users that can access the resource
			return not allowed
		###
		canAccess = deniedUsers.length is 0

		#return { canAccess: canAccess, deniedUsers : _.pluck deniedUsers, '_id' };
		return { canAccess: canAccess, deniedUsers : deniedUsers }
