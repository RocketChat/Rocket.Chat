Meteor.methods
	deleteOAuthApp: (applicationId) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteOAuthApp' });

		application = RocketChat.models.OAuthApps.findOne(applicationId)

		if not application?
			throw new Meteor.Error('error-application-not-found', 'Application not found', { method: 'deleteOAuthApp' });


		RocketChat.models.OAuthApps.remove _id: applicationId

		return true
