/* globals LDAP, slug, getLdapUsername, getLdapUserUniqueID, syncUserData, addLdapUser */
/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */

const logger = new Logger('LDAPHandler', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = {username};
		} else {
			username = {email: username};
		}
	}

	logger.info('Fallback to default account system', username);

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
	if (!loginRequest.ldap || !loginRequest.ldapOptions) {
		return undefined;
	}

	logger.info('Init LDAP login', loginRequest.username);

	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.ldapPass);
	}

	const self = this;
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
			if (ldap.isUserInGroup (loginRequest.username)) {
				ldapUser = users[0];
			} else {
				throw new Error('User not in a valid group');
			}
		} else {
			logger.info('Wrong password for', loginRequest.username);
		}
	} catch (error) {
		logger.error(error);
	}

	ldap.disconnect();

	if (ldapUser === undefined) {
		if (RocketChat.settings.get('LDAP_Login_Fallback') === true) {
			return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
		}

		throw new Meteor.Error('LDAP-login-error', `LDAP Authentication failed with provided username [${ loginRequest.username }]`);
	}

	let username;

	if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
		username = slug(getLdapUsername(ldapUser));
	} else {
		username = slug(loginRequest.username);
	}

	// Look to see if user already exists
	let userQuery;

	const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
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
			username
		};

		logger.debug('userQuery', userQuery);

		user = Meteor.users.findOne(userQuery);
	}

	// Login user if they exist
	if (user) {
		if (user.ldap !== true && RocketChat.settings.get('LDAP_Merge_Existing_Users') !== true) {
			logger.info('User exists without "ldap: true"');
			throw new Meteor.Error('LDAP-login-error', `LDAP Authentication succeded, but there's already an existing user with provided username [${ username }] in Mongo.`);
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

	logger.info('User does not exist, creating', username);

	// Create new user
	return addLdapUser(ldapUser, username, loginRequest.ldapPass);
});
