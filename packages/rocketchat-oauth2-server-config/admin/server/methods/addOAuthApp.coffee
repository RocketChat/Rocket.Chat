Meteor.methods
	addOAuthApp: (application) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'addOAuthApp' }

		if not _.isString(application.name) or application.name.trim() is ''
			throw new Meteor.Error 'error-invalid-name', 'Invalid name', { method: 'addOAuthApp' }

		if not _.isString(application.redirectUri) or application.redirectUri.trim() is ''
			throw new Meteor.Error 'error-invalid-redirectUri', 'Invalid redirectUri', { method: 'addOAuthApp' }

		if not _.isBoolean(application.active)
			throw new Meteor.Error 'error-invalid-arguments', 'Invalid arguments', { method: 'addOAuthApp' }

		application.clientId = Random.id()
		application.clientSecret = Random.secret()
		application._createdAt = new Date
		application._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		application._id = RocketChat.models.OAuthApps.insert application

		return application
