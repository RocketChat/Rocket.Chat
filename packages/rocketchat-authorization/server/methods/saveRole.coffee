Meteor.methods
	'authorization:saveRole': (_id, roleData) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error "not-authorized"

		saveData =
			description: roleData.description

		if not _id? and roleData.name?
			saveData.name = roleData.name

		return RocketChat.models.Roles.createOrUpdate saveData.name, 'Users', roleData.description
