logger = new Logger 'NGLoginHandler'


Accounts.registerLoginHandler 'orchestraNG', (loginRequest) ->
	if not loginRequest.ngPassword?
		# only process our login requests
		return

	if loginRequest.username == 'admin'
		# by design we do not manage admin user, fallback to default auth
		logger.info('not using NG auth for admin')
		username = loginRequest.username
		password = loginRequest.ngPassword
		loginRequest =
			user: null
			password:
				digest: SHA256(password)
				algorithm: 'sha-256'

		if typeof username is 'string'
			if username.indexOf('@') == -1
				loginRequest.user = username: username
			else
				loginRequest.user = email: username
		else
			loginRequest.user = username

		return Accounts._runLoginHandlers(this, loginRequest)

	logger.info('trying to authenticate', loginRequest.username)
	ng = new NGApi(RocketChat.settings.get('OrchestraIntegration_Server'))
	domain = RocketChat.settings.get('OrchestraIntegration_Domain')
	try
		res = ng.login "#{loginRequest.username}@#{domain}", loginRequest.ngPassword
	catch e
		# unauthorized or error contacting server
		logger.error "error logging in for user \"#{loginRequest.username}\": #{e}"
		return
	logger.info(res)

	token = res.token
	if not (res and res.token)
		logger.error "invalid response from server: #{res}"
		return

	try
		ngUser = ng.getUser(token)
		logger.info(ngUser)
		fieldsToKeep = [ 'username', 'language', 'firstname',
						  'middlename', 'lastname', 'email', 'timezone' ]
		for k of ngUser
			if k not in fieldsToKeep
				delete ngUser[k]
		logger.info('clean user', ngUser)
		if ngUser.middlename
			ngUser.name = "#{ngUser.firstname} #{ngUser.middlename} #{ngUser.lastname}"
		else
			ngUser.name = "#{ngUser.firstname} #{ngUser.lastname}"
	catch e
		# unauthorized or error contacting server
		logger.error "error in getUser in for user \"#{loginRequest.username}\": #{e}"
		return

	user = Meteor.users.findOne username: loginRequest.username
	if user
		ngUser.emails = [address: ngUser.email, "verified": true]
		delete ngUser.email
		Meteor.users.update user._id, $set: ngUser
		Accounts.setPassword user._id, loginRequest.ngPassword, logout: false
		logger.info "\"#{loginRequest.username}\" authenticated successfully"
		return userId: user._id#, token: stampedToken.token
	else
		logger.info "\"#{loginRequest.username}\" not found, creating it"
		ngUser.password = loginRequest.ngPassword

		try
			ngUser._id = Accounts.createUser ngUser
		catch e
			logger.error "Error creating user: #{e}"
			throw error

		Meteor.runAsUser ngUser._id,
			-> Meteor.call 'joinDefaultChannels'

		logger.info "\"#{loginRequest.username}\" authenticated successfully"
		return userId: ngUser._id
