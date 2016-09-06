Meteor.publish 'oauthApps', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
		@error Meteor.Error "error-not-allowed", "Not allowed", { publish: 'oauthApps' }

	return RocketChat.models.OAuthApps.find()
