oauth2server = new OAuth2Server
	accessTokensCollectionName: 'rocketchat_oauth_access_tokens'
	refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens'
	authCodesCollectionName: 'rocketchat_oauth_auth_codes'
	clientsCollection: RocketChat.models.OAuthApps.model
	debug: true


WebApp.connectHandlers.use oauth2server.app

oauth2server.routes.get '/oauth/userinfo', (req, res, next) ->
	if not req.headers.authorization?
		return res.sendStatus(401).send('No token')

	accessToken = req.headers.authorization.replace('Bearer ', '')

	token = oauth2server.oauth.model.AccessTokens.findOne accessToken: accessToken

	if not token?
		return res.sendStatus(401).send('Invalid Token')

	user = RocketChat.models.Users.findOneById(token.userId);

	if not user?
		return res.sendStatus(401).send('Invalid Token')

	res.send
		sub: user._id
		name: user.name
		email: user.emails[0].address
		email_verified: user.emails[0].verified
		department: ""
		birthdate: ""
		preffered_username: user.username
		updated_at: user._updatedAt
		picture: "#{Meteor.absoluteUrl()}avatar/#{user.username}"


Meteor.publish 'oauthClient', (clientId) ->
	unless @userId
		return @ready()

	return RocketChat.models.OAuthApps.find {clientId: clientId, active: true},
		fields:
			name: 1


RocketChat.API.v1.addAuthMethod ->
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

	return user: _.omit(user, '$loki')
