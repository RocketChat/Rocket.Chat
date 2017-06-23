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

	if !loginRequest.username.endsWith("@#{domain}")
		loginRequest.username = "#{loginRequest.username}@#{domain}"

	try
		res = ng.login loginRequest.username, loginRequest.ngPassword
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
		if ngUser.success is false
			throw new Error("getUser failed: #{ngUser.msg} (#{ngUser.errcode})")
		fieldsToKeep = [ 'ng_id', 'username', 'language', 'firstname',
						  'middlename', 'lastname', 'email', 'timezone' ]
		ngUser.ng_id = ngUser.id
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

	try
		phones = ng.getPhones(token)
		logger.info(phones)
		if phones.data and phones.data[0]
			phone = phones.data[0]
			ngUser.phonelogin = "#{phone.username}@#{domain}"
			ngUser.phonepassword = phone.password
			ngUser.phoneextension = phone.number_alias
		else if phones.data
			# no phone number defined, delete eventual phone
			ngUser.phonelogin = undefined
			ngUser.phonepassword = undefined
			ngUser.phoneextension = undefined
	catch e
		# ignore errors getting user's phones
		logger.error "error in getPhones in for user \"#{loginRequest.username}\": #{e}"

	username = loginRequest.username.substring(0, loginRequest.username.indexOf("@#{domain}"))
	user = Meteor.users.findOne username: username
	if (not user) and (ngUser.ng_id)
		# try looking for one with the same id and replace it
		# this is needed if the username was renamed
		user = Meteor.users.findOne ng_id: ngUser.ng_id

	ngUser.emails = [address: ngUser.email, "verified": true]
	delete ngUser.email
	if user
		Meteor.users.update user._id, $set: ngUser
		Accounts.setPassword user._id, loginRequest.ngPassword, logout: false
		logger.info "\"#{loginRequest.username}\" authenticated successfully"
		return userId: user._id
	else
		logger.info "\"#{loginRequest.username}\" not found, creating it"

		try
			ngUser._id = Accounts.createUser ngUser
		catch e
			logger.error "Error creating user: #{e}"
			throw e

		# Accounts.createUser do not add extra fields, so update it now
		Meteor.users.update ngUser._id, $set: ngUser
		Accounts.setPassword ngUser._id, loginRequest.ngPassword, logout: false

		Meteor.runAsUser ngUser._id,
			-> Meteor.call 'joinDefaultChannels'

		logger.info "\"#{loginRequest.username}\" authenticated successfully"
		return userId: ngUser._id
