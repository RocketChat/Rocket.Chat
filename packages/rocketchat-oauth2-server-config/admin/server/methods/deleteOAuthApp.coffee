Meteor.methods
	deleteOAuthApp: (applicationId) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
			throw new Meteor.Error 'not_authorized'

		application = RocketChat.models.OAuthApps.findOne(applicationId)

		if not application?
			throw new Meteor.Error 'invalid_application', '[methods] deleteOAuthApp -> application not found'

		RocketChat.models.OAuthApps.remove _id: applicationId

		return true
