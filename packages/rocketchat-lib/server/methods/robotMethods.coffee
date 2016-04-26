Meteor.methods
	'robot.modelCall': (model, method, args) ->
		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'robot.modelCall' }

		unless RocketChat.authz.hasRole Meteor.userId(), 'robot'
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'robot.modelCall' }

		unless _.isFunction RocketChat.models[model]?[method]
			throw new Meteor.Error 'error-invalid-method', 'Invalid method', { method: 'robot.modelCall' }

		call = RocketChat.models[model][method].apply(RocketChat.models[model], args)

		if call?.fetch?()?
			return call.fetch()
		else
			return call
