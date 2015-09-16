Meteor.methods
	migrateTo: (version) ->
		user = Meteor.user()

		if not user? or RocketChat.authz.hasPermission(user._id, 'run-migration') isnt true
			console.log '[methods] createChannel -> Not authorized'
			return

		this.unblock()
		Migrations.migrateTo version
		return version

	getMigrationVersion: ->
		return Migrations.getVersion()