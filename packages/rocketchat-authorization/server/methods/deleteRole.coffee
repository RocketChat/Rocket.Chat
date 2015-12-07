Meteor.methods
	'authorization:deleteRole': (_id) ->
		if not Meteor.userId() or not RocketChat.authz.hasPermission Meteor.userId(), 'access-rocket-permissions'
			throw new Meteor.Error "not-authorized"

		console.log '[methods] authorization:deleteRole -> '.green, 'arguments:', arguments

		role = Meteor.roles.findOne _id

		if role.protected
			throw new Meteor.Error 'protected-role', TAPi18n.__('Cannot_delete_an_protected_role')

		someone = Meteor.users.findOne { "roles.#{Roles.GLOBAL_GROUP}": role.name }

		if someone?
			throw new Meteor.Error 'role-in-use', TAPi18n.__('Cannot_delete_role_because_its_in_use')

		return Roles.deleteRole role.name
