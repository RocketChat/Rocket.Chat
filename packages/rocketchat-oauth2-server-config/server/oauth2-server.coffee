oauth2server = new OAuth2Server
	accessTokensCollectionName: 'rocketchat-oauth-access-tokens'
	refreshTokensCollectionName: 'rocketchat-oauth-refresh-tokens'
	clientsCollectionName: 'rocketchat-oauth-clients'
	authCodesCollectionName: 'rocketchat-oauth-auth-codes'
	debug: true

WebApp.rawConnectHandlers.use oauth2server.app
# JsonRoutes.Middleware.use oauth2server.app

if not oauth2server.model.Clients.findOne()
	oauth2server.model.Clients.insert
		clientId: 'papers3'
		clientSecret: '123'
		redirectUri: 'http://localhost:3000/_oauth/rc'

oauth2server.routes.get '/account', oauth2server.oauth.authorise(), (req, res, next) ->
	user = Meteor.users.findOne req.user.id

	res.send
		id: user._id
		name: user.name
