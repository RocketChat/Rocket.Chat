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
	# console.log 'options ->',JSON.stringify options, null, '  '
	# console.log 'user ->',JSON.stringify user, null, '  '

	user.status = 'offline'

	serviceName = null

	if user.services?.facebook?
		serviceName = 'facebook'
	else if user.services?.google?
		serviceName = 'google'
	else if user.services?.github?
		serviceName = 'github'
	else if user.services?['meteor-developer']?
		serviceName = 'meteor-developer'

	if serviceName in ['facebook', 'google', 'meteor-developer', 'github']
		if not user?.name? or user.name is ''
			if options.profile?.name?
				user.name = options.profile?.name
			else if user.services[serviceName].name?
				user.name = user.services[serviceName].name
			else
				user.name = user.services[serviceName].username

		user.emails = [
			address: user.services[serviceName].email
			verified: true
		]

	return user


Accounts.validateLoginAttempt (login) ->
	login = RocketChat.callbacks.run 'beforeValidateLogin', login
	if login.allowed isnt true
		return login.allowed

	if login.type is 'password' and Meteor.settings.denyUnverifiedEmails is true
		validEmail = login.user.emails.filter (email) ->
			return email.verified is true

		if validEmail.length is 0
			throw new Meteor.Error 'no-valid-email'
			return false

	Meteor.users.update {_id: login.user._id}, {$set: {lastLogin: new Date}}
	Meteor.defer ->
		RocketChat.callbacks.run 'afterValidateLogin', login

	return true
