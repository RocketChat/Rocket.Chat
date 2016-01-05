Meteor.publish 'oauthApps', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'manage-oauth-apps'
		throw new Meteor.Error "not-authorized"

	return RocketChat.models.OAuthApps.find()
