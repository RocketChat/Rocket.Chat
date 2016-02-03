RocketChat.Migrations.add
	version: 27
	up: ->
		RocketChat.models.Users.update({}, { $rename: { roles: '_roles' } }, { multi: true })

		RocketChat.models.Users.find({ _roles: { $exists: 1 } }).forEach (user) ->
			for scope, roles of user._roles
				RocketChat.models.Roles.addUserRoles(user._id, roles, scope)

		RocketChat.models.Users.update({}, { $unset: { _roles: 1 } }, { multi: true })
