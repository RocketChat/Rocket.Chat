Meteor.methods
	'authorization:addUserToRole': (roleName, username, scope) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error "not-authorized"

		if not roleName or not _.isString(roleName) or not username or not _.isString(username)
			throw new Meteor.Error 'invalid-arguments'

		user = RocketChat.models.Users.findOneByUsername username, { fields: { _id: 1 } }

		if not user?._id?
			throw new Meteor.Error 'user-not-found', 'User_not_found'

		RocketChat.Notifications.notifyAll('roles-change', { type: 'added', _id: roleName, u: { _id: user._id, username: username }, scope: scope });

		return RocketChat.models.Roles.addUserRoles user._id, roleName, scope
