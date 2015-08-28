# Deny Account.createUser in client
Accounts.config { forbidClientAccountCreation: true }

Accounts.emailTemplates.siteName = "ROCKET.CHAT";
Accounts.emailTemplates.from = "ROCKET.CHAT <no-reply@rocket.chat>";

verifyEmailText = Accounts.emailTemplates.verifyEmail.text
Accounts.emailTemplates.verifyEmail.text = (user, url) ->
	url = url.replace Meteor.absoluteUrl(), Meteor.absoluteUrl() + 'login/'
	verifyEmailText user, url

resetPasswordText = Accounts.emailTemplates.resetPassword.text
Accounts.emailTemplates.resetPassword.text = (user, url) ->
	url = url.replace Meteor.absoluteUrl(), Meteor.absoluteUrl() + 'login/'
	verifyEmailText user, url

Accounts.onCreateUser (options, user) ->
	# console.log 'onCreateUser ->',JSON.stringify arguments, null, '  '
	# console.log 'options ->',JSON.stringify options, null, '  '
	# console.log 'user ->',JSON.stringify user, null, '  '

	user.status = 'offline'
	user.active = not RocketChat.settings.get 'Accounts_ManuallyApproveNewUsers'

	# when inserting first user, set admin: true
	unless Meteor.users.findOne()
		user.admin = true

	serviceName = null

	if user.services?.facebook?
		serviceName = 'facebook'
	else if user.services?.google?
		serviceName = 'google'
	else if user.services?.github?
		serviceName = 'github'
	else if user.services?.gitlab?
		serviceName = 'gitlab'
	else if user.services?['meteor-developer']?
		serviceName = 'meteor-developer'
	else if user.services?.twitter?
		serviceName = 'twitter'

	if serviceName in ['facebook', 'google', 'meteor-developer', 'github', 'gitlab', 'twitter']
		if not user?.name? or user.name is ''
			if options.profile?.name?
				user.name = options.profile?.name
			else if user.services[serviceName].name?
				user.name = user.services[serviceName].name
			else
				user.name = user.services[serviceName].username

		if user.services[serviceName].email
			user.emails = [
				address: user.services[serviceName].email
				verified: true
			]

	return user


Accounts.validateLoginAttempt (login) ->
	login = RocketChat.callbacks.run 'beforeValidateLogin', login
	if login.allowed isnt true
		return login.allowed

	if login.user?.active isnt true
		throw new Meteor.Error 'inactive-user', TAPi18next.t 'project:User_is_not_activated'
		return false

	if login.type is 'password' and RocketChat.settings.get('Accounts_EmailVerification') is true
		validEmail = login.user.emails.filter (email) ->
			return email.verified is true

		if validEmail.length is 0
			throw new Meteor.Error 'no-valid-email'
			return false

	Meteor.users.update {_id: login.user._id}, {$set: {lastLogin: new Date}}
	Meteor.defer ->
		RocketChat.callbacks.run 'afterValidateLogin', login

	return true
