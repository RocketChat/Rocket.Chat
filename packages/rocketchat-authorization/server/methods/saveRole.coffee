Meteor.methods
	'authorization:saveRole': (_id, roleData) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log '[methods] authorization:saveRole -> '.green, 'arguments:', arguments

		saveData =
			description: roleData.description

		if not _id? and roleData.name?
			saveData.name = roleData.name

		if _id?
			return Meteor.roles.update _id, { $set: saveData }
		else
			return Meteor.roles.insert saveData
