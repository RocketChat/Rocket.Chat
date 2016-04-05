/* globals LDAP, slug, getLdapUsername, getLdapUserUniqueID, syncUserData, getDataToSyncUserData */
/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */

const logger = new Logger('LDAPHandler', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = {username: username};
		} else {
			username = {email: username};
		}
	}

	logger.info('Fallback to default account systen', username);

	const loginRequest = {
		user: username,
		password: {
			digest: SHA256(password),
			algorithm: 'sha-256'
		}
	};

	return Accounts._runLoginHandlers(bind, loginRequest);
}


Accounts.registerLoginHandler('ldap', function(loginRequest) {
	const self = this;

	if (!loginRequest.ldapOptions) {
		return undefined;
	}

	logger.info('Init login', loginRequest.username);

	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
	}

	const ldap = new LDAP();
	let ldapUser;

	try {
		ldap.connectSync();
		const users = ldap.searchUsersSync(loginRequest.username);

		if (users.length !== 1) {
			logger.info('Search returned', users.length, 'record(s) for', loginRequest.username);
			throw new Error('User not Found');
		}

		if (ldap.authSync(users[0].dn, loginRequest.ldapPass) === true) {
			ldapUser = users[0];
		} else {
			logger.info('Wrong password for', loginRequest.username);
		}
	} catch(error) {
		logger.error(error);
	}

	ldap.disconnect();

	if (ldapUser === undefined) {
		return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
	}

	let username;

	if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
		username = slug(getLdapUsername(ldapUser));
	} else {
		username = slug(loginRequest.username);
	}

	// Look to see if user already exists
	let userQuery;

	let Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
	let user;

	if (Unique_Identifier_Field) {
		userQuery = {
			'services.ldap.id': Unique_Identifier_Field.value
		};

		logger.info('Querying user');
		logger.debug('userQuery', userQuery);

		user = Meteor.users.findOne(userQuery);
	}

	if (!user) {
		userQuery = {
			username: username
		};

		logger.debug('userQuery', userQuery);

		user = Meteor.users.findOne(userQuery);
	}

	// Login user if they exist
	if (user) {
		if (user.ldap !== true) {
			logger.info('User exists without "ldap: true"');
			throw new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, but there\'s already an existing user with provided username ['+username+'] in Mongo.');
		}

		logger.info('Logging user');

		const stampedToken = Accounts._generateStampedLoginToken();

		Meteor.users.update(user._id, {
			$push: {
				'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
			}
		});

		syncUserData(user, ldapUser);
		Accounts.setPassword(user._id, loginRequest.ldapPass, {logout: false});
		return {
			userId: user._id,
			token: stampedToken.token
		};
	}

	logger.info('User does not exists, creating', username);
	// Create new user
	var userObject = {
		username: username
	};

	let userData = getDataToSyncUserData(ldapUser, {});

	if (userData && userData.emails) {
		userObject.email = userData.emails[0].address;
	} else if (ldapUser.object.mail && ldapUser.object.mail.indexOf('@') > -1) {
		userObject.email = ldapUser.object.mail;
	} else if (RocketChat.settings.get('LDAP_Default_Domain') !== '') {
		userObject.email = username + '@' + RocketChat.settings.get('LDAP_Default_Domain');
	} else {
		const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?');
		logger.error(error);
		throw error;
	}

	logger.debug('New user data', userObject);

	userObject.password = loginRequest.ldapPass;

	try {
		userObject._id = Accounts.createUser(userObject);
	} catch(error) {
		logger.error('Error creating user', error);
		throw error;
	}

	syncUserData(userObject, ldapUser);

	let ldapUserService = {
		ldap: true
	};

	if (Unique_Identifier_Field) {
		ldapUserService['services.ldap.idAttribute'] = Unique_Identifier_Field.attribute;
		ldapUserService['services.ldap.id'] = Unique_Identifier_Field.value;
	}

	Meteor.users.update(userObject._id, {
		$set: ldapUserService
	});

	logger.info('Joining user to default channels');
	Meteor.runAsUser(userObject._id, function() {
		Meteor.call('joinDefaultChannels');
	});

	return {
		userId: userObject._id
	};
});
