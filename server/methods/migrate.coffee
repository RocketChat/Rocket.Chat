Meteor.methods
	migrate: (version) ->
		user = Meteor.user()

		if not user? or user.admin isnt true
			return

		this.ublock()
		Migrations.migrateTo version
		return version

	getMigrationVersion: ->
		return Migrations.getVersion()