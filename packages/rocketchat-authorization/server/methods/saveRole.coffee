Meteor.methods
	'authorization:saveRole': (_id, roleData) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log '[methods] authorization:saveRole -> '.green, 'arguments:', arguments

		if roleData?.description?
			return Meteor.roles.update _id, { $set: { description: roleData.description } }
