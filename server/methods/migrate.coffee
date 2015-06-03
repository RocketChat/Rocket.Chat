Meteor.methods
	migrateTo: (version) ->
		user = Meteor.user()

		if not user? or user.admin isnt true
			return

		this.unblock()
		Migrations.migrateTo version
		return version

	getMigrationVersion: ->
		return Migrations.getVersion()