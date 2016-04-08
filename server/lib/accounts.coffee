# Deny Account.createUser in client and set Meteor.loginTokenExpires
accountsConfig = { forbidClientAccountCreation: true, loginExpirationInDays: RocketChat.settings.get 'Accounts_LoginExpiration' }
Accounts.config accountsConfig

RocketChat.settings.get 'Accounts_AllowedDomainsList', (_id, value) ->
	domainWhiteList = _.map value.split(','), (domain) -> domain.trim()
	restrictCreationByEmailDomain = if domainWhiteList.length == 1 then domainWhiteList[0] else (email) ->
		ret = false
		for domain in domainWhiteList
			if email.match('@' + RegExp.escape(domain) + '$')
				ret = true
				break;

		return ret
	delete Accounts._options['restrictCreationByEmailDomain']

	if not _.isEmpty value
		Accounts.config({ restrictCreationByEmailDomain: restrictCreationByEmailDomain });

Accounts.emailTemplates.siteName = RocketChat.settings.get 'Site_Name';
Accounts.emailTemplates.from = "#{RocketChat.settings.get 'Site_Name'} <#{RocketChat.settings.get 'From_Email'}>";

verifyEmailText = Accounts.emailTemplates.verifyEmail.text
Accounts.emailTemplates.verifyEmail.text = (user, url) ->
	url = url.replace Meteor.absoluteUrl(), Meteor.absoluteUrl() + 'login/'
	verifyEmailText user, url

resetPasswordText = Accounts.emailTemplates.resetPassword.text
Accounts.emailTemplates.resetPassword.text = (user, url) ->
	url = url.replace /\/#\//, '/'
	resetPasswordText user, url

if RocketChat.settings.get 'Accounts_Enrollment_Email'
	Accounts.emailTemplates.enrollAccount.text = (user, url) ->
		text = RocketChat.settings.get 'Accounts_Enrollment_Email'

		text = text.replace /\[name\]/g, user.name or ''
		text = text.replace /\[fname\]/g, _.strLeft(user.name, ' ') or  ''
		text = text.replace /\[lname\]/g, _.strRightBack(user.name, ' ') or  ''
		text = text.replace /\[email\]/g, user.emails?[0]?.address or ''

		return text

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
Accounts.insertUserDoc = _.wrap Accounts.insertUserDoc, (insertUserDoc, options, user) ->
	roles = []
	if Match.test(user.globalRoles, [String]) and user.globalRoles.length > 0
		roles = roles.concat user.globalRoles

	delete user.globalRoles

	user.type ?= 'user'

	_id = insertUserDoc.call(Accounts, options, user)

	if roles.length is 0
		# when inserting first user give them admin privileges otherwise make a regular user
		hasAdmin = RocketChat.models.Users.findOne({ roles: 'admin' }, {fields: {_id: 1}})
		if hasAdmin?
			roles.push 'user'
		else
			roles.push 'admin'

	RocketChat.authz.addUserRoles(_id, roles)

	RocketChat.callbacks.run 'afterCreateUser', options, user
	return _id

Accounts.validateLoginAttempt (login) ->
	login = RocketChat.callbacks.run 'beforeValidateLogin', login

	if login.allowed isnt true
		return login.allowed

	if !!login.user?.active isnt true
		throw new Meteor.Error 'inactive-user', TAPi18n.__ 'User_is_not_activated'
		return false

	# If user is admin, no need to check if e-mail is verified
	if 'admin' not in login.user?.roles and login.type is 'password' and RocketChat.settings.get('Accounts_EmailVerification') is true
		validEmail = login.user.emails.filter (email) ->
			return email.verified is true

		if validEmail.length is 0
			throw new Meteor.Error 'no-valid-email'
			return false

	RocketChat.models.Users.updateLastLoginById login.user._id

	Meteor.defer ->
		RocketChat.callbacks.run 'afterValidateLogin', login

	return true

Accounts.validateNewUser (user) ->
	if RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Enabled') is false and RocketChat.settings.get('LDAP_Enable') is false and not user.services?.password?
		throw new Meteor.Error 'registration-disabled-authentication-services', 'User registration is disabled for authentication services'
	return true
