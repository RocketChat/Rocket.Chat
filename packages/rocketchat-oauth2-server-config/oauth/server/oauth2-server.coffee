oauth2server = new OAuth2Server
	accessTokensCollectionName: 'rocketchat_oauth_access_tokens'
	refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens'
	authCodesCollectionName: 'rocketchat_oauth_auth_codes'
	clientsCollection: RocketChat.models.OAuthApps.model
	debug: true


WebApp.connectHandlers.use oauth2server.app


Meteor.publish 'oauthClient', (clientId) ->
	unless @userId
		return @ready()

	return RocketChat.models.OAuthApps.find {clientId: clientId, active: true},
		fields:
			name: 1


RocketChat.API.v1.addAuthMethod ->
	console.log @request.method, @request.url

	headerToken = @request.headers['authorization']
	getToken = @request.query.access_token

	if headerToken?
		if matches = headerToken.match(/Bearer\s(\S+)/)
			headerToken = matches[1]
		else
			headerToken = undefined

	bearerToken = headerToken or getToken

	if not bearerToken?
		# console.log 'token not found'.red
		return

	# console.log 'bearerToken', bearerToken

	getAccessToken = Meteor.wrapAsync oauth2server.oauth.model.getAccessToken, oauth2server.oauth.model
	accessToken = getAccessToken bearerToken

	if not accessToken?
		# console.log 'accessToken not found'.red
		return

	if accessToken.expires? and accessToken.expires isnt 0 and accessToken.expires < new Date()
		# console.log 'accessToken expired'.red
		return

	user = RocketChat.models.Users.findOne(accessToken.userId)
	if not user?
		# console.log 'user not found'.red
		return

	return user: user

