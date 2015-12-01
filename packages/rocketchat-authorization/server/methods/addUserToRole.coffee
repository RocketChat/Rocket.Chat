Meteor.methods
	'authorization:addUserToRole': (roleName, username) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log('[methods] authorization:addUserToRole -> '.green, 'arguments:', arguments);

		if not roleName or not _.isString(roleName) or not username or not _.isString(username)
			throw new Meteor.Error 'invalid-arguments'

		user = Meteor.users.findOne { username: username }, { fields: { _id: 1 } }

		if not user?._id?
			throw new Meteor.Error 'user-not-found'

		# return Roles.addUsersToRoles user._id, roleName
		return Roles.addUsersToRoles user._id, roleName, Roles.GLOBAL_GROUP
