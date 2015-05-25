Accounts.emailTemplates.siteName = "ROCKET.CHAT";
Accounts.emailTemplates.from = "ROCKET.CHAT <no-reply@rocket.chat>";

Accounts.onCreateUser (options, user) ->
	console.log 'options ->',JSON.stringify options, null, '  '
	console.log 'user ->',JSON.stringify user, null, '  '

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
	if login.allowed is true and login.type is 'password'
		validEmail = login.user.emails.filter (email) ->
			return email.verified is true

		if validEmail.length is 0
			throw new Meteor.Error 'no-valid-email'
			return false

	if not login.user.lastLogin?
		# put user in #general channel
		ChatRoom.update('57om6EQCcFami9wuT', { $addToSet: { uids: login.user._id }})
		if not ChatSubscription.findOne(rid: '57om6EQCcFami9wuT', uid: login.user._id)?
			ChatSubscription.insert
				rid: '57om6EQCcFami9wuT'
				uid: login.user._id
				ls: (new Date())
				rn: '#general'
				t: 'g'
				f: true
				ts: new Date()
				unread: 0

			if login.user.name?
				ChatMessage.insert
					rid: '57om6EQCcFami9wuT'
					ts: new Date()
					t: 'wm'
					msg: login.user.name

	Meteor.users.update {_id: login.user._id}, {$set: {lastLogin: new Date}}

	return true
