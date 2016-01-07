oauth2server = new OAuth2Server
	accessTokensCollectionName: 'rocketchat_oauth_access_tokens'
	refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens'
	authCodesCollectionName: 'rocketchat_oauth_auth_codes'
	clientsCollection: RocketChat.models.OAuthApps.model
	debug: true

WebApp.connectHandlers.use oauth2server.app
# JsonRoutes.Middleware.use oauth2server.app

oauth2server.routes.get '/account', oauth2server.oauth.authorise(), (req, res, next) ->
	user = Meteor.users.findOne req.user.id

	res.send
		id: user._id
		name: user.name
