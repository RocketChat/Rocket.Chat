var slug = function (text) {
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
};

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string')
		if (username.indexOf('@') === -1)
			username = {username: username};
		else
			username = {email: username};

	loginRequest = {
		user: username,
		password: {
			digest: SHA256(password),
			algorithm: "sha-256"
		}
	};

	return Accounts._runLoginHandlers(bind, loginRequest);
}

function getDataToSyncUserData(ldapUser) {
	const syncUserData = RocketChat.settings.get('LDAP_Sync_User_Data');
	const syncUserDataFieldMap = RocketChat.settings.get('LDAP_Sync_User_Data_FieldMap').trim();

	if (syncUserData && syncUserDataFieldMap) {
		const fieldMap = JSON.parse(syncUserDataFieldMap);
		let userData = {};

		let emailList = [];
		_.map(fieldMap, function(userField, ldapField) {
			if (!ldapUser.hasOwnProperty(ldapField)) {
				return;
			}

			switch (userField) {
				case 'email':
					if (_.isObject(ldapUser[ldapField] === 'object')) {
						_.map(ldapUser[ldapField], function (item) {
							emailList.push({ address: item, verified: true });
						});
					} else {
						emailList.push({ address: ldapUser[ldapField], verified: true });
					}
					break;

				case 'name':
					userData.name = ldapUser[ldapField];
					break;
			}
		});

		if (emailList.length > 0) {
			userData.emails = emailList;
		}

		if (_.size(userData)) {
			return userData;
		}
	}
}

function syncUserData(userId, ldapUser) {
	const userData = getDataToSyncUserData(ldapUser);
	if (userId && userData) {
		Meteor.users.update(userId, { $set: userData });
	}
}

Accounts.registerLoginHandler("ldap", function(loginRequest) {
	const self = this;

	if (!loginRequest.ldapOptions) {
		return undefined;
	}

	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
	}

	const ldap = new LDAP();
	let ldapUser;

	try {
		ldap.connectSync();
		users = ldap.searchUsersSync(loginRequest.username);

		if (users.length !== 1) {
			console.log('LDAP: Search returned', users.length, 'record(s)');
			throw new Error('User not Found');
		}

		if (ldap.authSync(users[0].dn, loginRequest.ldapPass) === true) {
			ldapUser = users[0];
		} else {
			console.log('wrong password');
		}
	} catch(error) {
		console.log(error);
	}

	ldap.disconnect();

	if (ldapUser === undefined) {
		console.log('[LDAP] Falling back to standard account base');
		return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
	}

	const username = slug(loginRequest.username);

	// Look to see if user already exists
	const user = Meteor.users.findOne({
		username: username
	});

	// Login user if they exist
	if (user) {
		if (user.ldap !== true) {
			throw new Meteor.Error("LDAP-login-error", "LDAP Authentication succeded, but there's already an existing user with provided username ["+username+"] in Mongo.");
		}

		const stampedToken = Accounts._generateStampedLoginToken();
		const hashStampedToken =
		Meteor.users.update(user._id, {
			$push: {
				'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
			}
		});

		syncUserData(user._id, ldapUser);
		return {
			userId: user._id,
			token: stampedToken.token
		};
	}

	// Create new user
	var userObject = {
		username: username
	};

	let userData = getDataToSyncUserData(ldapUser);

	if (userData && userData.emails) {
		userObject.email = userData.emails[0].address;
	} else if (ldapUser.mail && ldapUser.mail.indexOf('@') > -1) {
		userObject.email = ldapUser.mail;
	} else if (RocketChat.settings.get('LDAP_Default_Domain') !== '') {
		userObject.email = username + '@' + RocketChat.settings.get('LDAP_Default_Domain');
	} else {
		throw new Meteor.Error("LDAP-login-error", "LDAP Authentication succeded, there is no email to create an account.");
	}

	let userId = Accounts.createUser(userObject);

	syncUserData(userId, ldapUser);
	Meteor.users.update(userId, {
		$set: {
			ldap: true
		}
	});

	Meteor.runAsUser(userId, function() {
		Meteor.call('joinDefaultChannels');
	});

	return {
		userId: userId
	};
});
