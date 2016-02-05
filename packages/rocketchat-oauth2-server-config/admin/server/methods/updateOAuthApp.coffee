Meteor.methods
	updateOAuthApp: (applicationId, application) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
			throw new Meteor.Error 'not_authorized'

		if not _.isString(application.name)
			throw new Meteor.Error 'invalid_name', '[methods] updateOAuthApp -> name must be string'

		if application.name.trim() is ''
			throw new Meteor.Error 'invalid_name', '[methods] updateOAuthApp -> name can\'t be empty'

		if not _.isString(application.redirectUri)
			throw new Meteor.Error 'invalid_redirectUri', '[methods] updateOAuthApp -> redirectUri must be string'

		if application.redirectUri.trim() is ''
			throw new Meteor.Error 'invalid_redirectUri', '[methods] updateOAuthApp -> redirectUri can\'t be empty'

		if not _.isBoolean(application.active)
			throw new Meteor.Error 'invalid_active', '[methods] updateOAuthApp -> active must be boolean'

		currentApplication = RocketChat.models.OAuthApps.findOne(applicationId)
		if not currentApplication?
			throw new Meteor.Error 'invalid_application', '[methods] updateOAuthApp -> application not found'

		RocketChat.models.OAuthApps.update applicationId,
			$set:
				name: application.name
				active: application.active
				redirectUri: application.redirectUri
				_updatedAt: new Date
				_updatedBy: RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		return RocketChat.models.OAuthApps.findOne(applicationId)
