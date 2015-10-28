# Deny Account.createUser in client
accountsConfig = { forbidClientAccountCreation: true }

if RocketChat.settings.get('Account_AllowedDomainsList')
	domainWhiteList = _.map RocketChat.settings.get('Account_AllowedDomainsList').split(','), (domain) -> domain.trim()
	accountsConfig.restrictCreationByEmailDomain = (email) ->
		ret = false
		for domain in domainWhiteList
			if email.match(domain + '$')
				ret = true
				break;

		return ret

Accounts.config accountsConfig

Accounts.emailTemplates.siteName = RocketChat.settings.get 'Site_Name';
Accounts.emailTemplates.from = "#{RocketChat.settings.get 'Site_Name'} <#{RocketChat.settings.get 'From_Email'}>";

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

	RocketChat.callbacks.run 'beforeCreateUser', options, user

	user.status = 'offline'
	user.active = not RocketChat.settings.get 'Accounts_ManuallyApproveNewUsers'

	if not user?.name? or user.name is ''
		if options.profile?.name?
			user.name = options.profile?.name

	if user.services?
		for serviceName, service of user.services
			if not user?.name? or user.name is ''
				if service.name?
					user.name = service.name
				else if service.username?
					user.name = service.username

			if not user.emails? and service.email?
				user.emails = [
					address: service.email
					verified: true
				]

	return user

# Wrap insertUserDoc to allow executing code after Accounts.insertUserDoc is run
Accounts.insertUserDoc = _.wrap Accounts.insertUserDoc, (insertUserDoc) ->
	options = arguments[1]
	user = arguments[2]
	_id = insertUserDoc.call(Accounts, options, user)

	# when inserting first user give them admin privileges otherwise make a regular user
	firstUser = RocketChat.models.Users.findOne({},{sort:{createdAt:1}})
	roleName = if firstUser?._id is _id then 'admin' else 'user'

	RocketChat.authz.addUsersToRoles(_id, roleName)
	RocketChat.callbacks.run 'afterCreateUser', options, user
	return _id

Accounts.validateLoginAttempt (login) ->
	login = RocketChat.callbacks.run 'beforeValidateLogin', login

	if login.allowed isnt true
		return login.allowed

	if login.user?.active isnt true
		throw new Meteor.Error 'inactive-user', TAPi18n.__ 'User_is_not_activated'
		return false

	if login.type is 'password' and RocketChat.settings.get('Accounts_EmailVerification') is true
		validEmail = login.user.emails.filter (email) ->
			return email.verified is true

		if validEmail.length is 0
			throw new Meteor.Error 'no-valid-email'
			return false

	RocketChat.models.Users.updateLastLoginById login.user._id

	Meteor.defer ->
		RocketChat.callbacks.run 'afterValidateLogin', login

	return true
