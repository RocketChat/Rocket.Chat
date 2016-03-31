Meteor.methods
	'authorization:saveRole': (_id, roleData) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-permissions'
			throw new Meteor.Error "not-authorized"

		if not roleData.name?
			throw new Meteor.Error 'invalid-data', 'Role name is required'

		if roleData.scope not in ['Users', 'Subscriptions']
			roleData.scope = 'Users'

		return RocketChat.models.Roles.createOrUpdate roleData.name, roleData.scope, roleData.description
