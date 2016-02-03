Meteor.methods
	restart_server: ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] restart_server -> Invalid user"

		unless RocketChat.authz.hasRole( Meteor.userId(), 'admin') is true
			throw new Meteor.Error 'not-authorized', '[methods] restart_server -> Not authorized'

		Meteor.setTimeout ->
			process.exit(1)
		, 2000

		return {} =
			message: "The_server_will_restart_in_s_seconds"
			params: [2]
