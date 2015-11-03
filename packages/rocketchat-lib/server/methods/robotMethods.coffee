Meteor.methods
	'robot.modelCall': (model, method, args) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] robot.modelCall -> Invalid user'

		unless RocketChat.authz.hasRole Meteor.userId(), 'robot'
			throw new Meteor.Error 'unauthorized', '[methods] robot.modelCall -> Unauthorized'

		console.log '[method] robot.modelCall'.green, arguments

		unless _.isFunction RocketChat.models[model]?[method]
			throw new Meteor.Error 'invalid-method', '[methods] robot.modelCall -> Invalid method'

		call = RocketChat.models[model][method].apply(RocketChat.models[model], args)
		console.log call
		return call
