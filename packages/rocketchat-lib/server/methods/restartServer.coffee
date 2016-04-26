Meteor.methods
	restart_server: ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'restart_server' }

		unless RocketChat.authz.hasRole( Meteor.userId(), 'admin') is true
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'restart_server' }

		Meteor.setTimeout ->
			process.exit(1)
		, 2000

		return {} =
			message: "The_server_will_restart_in_s_seconds"
			params: [2]
