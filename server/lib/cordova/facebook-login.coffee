Accounts.registerLoginHandler (loginRequest) ->
	if not loginRequest.cordova
		return undefined

	loginRequest = loginRequest.authResponse
	identity = getIdentity(loginRequest.accessToken)

	serviceData =
		accessToken: loginRequest.accessToken
		expiresAt: (+new Date) + (1000 * loginRequest.expiresIn)

	whitelisted = ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'username', 'gender', 'locale', 'age_range']

	fields = _.pick(identity, whitelisted)
	_.extend(serviceData, fields)

	options = {profile: {}}
	profileFields = _.pick(identity, whitelisted)
	_.extend(options.profile, profileFields)

	return Accounts.updateOrCreateUserFromExternalService("facebook", serviceData, options)


getIdentity = (accessToken) ->
	try
		return HTTP.get("https://graph.facebook.com/me", {params: {access_token: accessToken}}).data

	catch err
		throw _.extend new Error("Failed to fetch identity from Facebook. " + err.message), {response: err.response}