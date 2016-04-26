Meteor.methods
	migrateTo: (version) ->
		user = Meteor.user()

		if not user? or RocketChat.authz.hasPermission(user._id, 'run-migration') isnt true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'migrateTo' }

		this.unblock()
		RocketChat.Migrations.migrateTo version
		return version

	getMigrationVersion: ->
		return RocketChat.Migrations.getVersion()
