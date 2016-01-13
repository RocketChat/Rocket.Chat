Meteor.methods
	addOAuthApp: (application) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
			throw new Meteor.Error 'not_authorized'

		if not _.isString(application.name)
			throw new Meteor.Error 'invalid_name', '[methods] addOAuthApp -> name must be string'

		if application.name.trim() is ''
			throw new Meteor.Error 'invalid_name', '[methods] addOAuthApp -> name can\'t be empty'

		if not _.isString(application.redirectUri)
			throw new Meteor.Error 'invalid_redirectUri', '[methods] addOAuthApp -> redirectUri must be string'

		if application.redirectUri.trim() is ''
			throw new Meteor.Error 'invalid_redirectUri', '[methods] addOAuthApp -> redirectUri can\'t be empty'

		if not _.isBoolean(application.active)
			throw new Meteor.Error 'invalid_active', '[methods] addOAuthApp -> active must be boolean'

		application.clientId = Random.id()
		application.clientSecret = Random.secret()
		application._createdAt = new Date
		application._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		application._id = RocketChat.models.OAuthApps.insert application

		return application
