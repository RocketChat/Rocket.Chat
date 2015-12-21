Meteor.methods
	migrateTo: (version) ->
		user = Meteor.user()

		if not user? or RocketChat.authz.hasPermission(user._id, 'run-migration') isnt true
			throw new Meteor.Error "not-authorized", '[methods] migrateTo'

		this.unblock()
		Migrations.migrateTo version
		return version

	getMigrationVersion: ->
		return Migrations.getVersion()
