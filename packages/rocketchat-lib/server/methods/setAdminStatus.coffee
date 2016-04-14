Meteor.methods
	setAdminStatus: (userId, admin) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] setAdminStatus -> Invalid user"

		unless RocketChat.authz.hasPermission( Meteor.userId(), 'assign-admin-role') is true
			throw new Meteor.Error 'not-authorized', '[methods] setAdminStatus -> Not authorized'

		user = Meteor.users.findOne({ _id: userId }, { fields: { username: 1 } })

		if admin
			return Meteor.call('authorization:addUserToRole', 'admin', user.username);
		else
			return Meteor.call('authorization:removeUserFromRole', 'admin', user.username);
