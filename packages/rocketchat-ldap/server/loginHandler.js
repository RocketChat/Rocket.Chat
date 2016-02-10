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
			if (!ldapUser.object.hasOwnProperty(ldapField)) {
				return;
			}

			switch (userField) {
				case 'email':
					if (_.isObject(ldapUser.object[ldapField] === 'object')) {
						_.map(ldapUser.object[ldapField], function (item) {
							emailList.push({ address: item, verified: true });
						});
					} else {
						emailList.push({ address: ldapUser.object[ldapField], verified: true });
					}
					break;

				case 'name':
					userData.name = ldapUser.object[ldapField];
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

function syncUserData(user, ldapUser) {
	console.log('sync user data', arguments);
	const userData = getDataToSyncUserData(ldapUser);
	if (user && user._id && userData) {
		Meteor.users.update(user._id, { $set: userData });
	}

	if (user && user._id) {
		const avatar = ldapUser.raw.thumbnailPhoto || ldapUser.raw.jpegPhoto;
		if (avatar) {
			const rs = RocketChatFile.bufferToStream(avatar);
			RocketChatFileAvatarInstance.deleteFile(encodeURIComponent(`${user.username}.jpg`));
			const ws = RocketChatFileAvatarInstance.createWriteStream(encodeURIComponent(`${user.username}.jpg`), 'image/jpeg');
			ws.on('end', Meteor.bindEnvironment(function() {
				Meteor.setTimeout(function() {
					RocketChat.models.Users.setAvatarOrigin(user._id, 'ldap');
					RocketChat.Notifications.notifyAll('updateAvatar', {username: user.username});
				}, 500);
			}));
			rs.pipe(ws);
		}
	}
}

function getLdapUserUniqueID(ldapUser, fallback) {
	let Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field');

	if (Unique_Identifier_Field !== '') {
		Unique_Identifier_Field = Unique_Identifier_Field.split(',').find((field) => {
			return !_.isEmpty(ldapUser.object[field]);
		});
		if (Unique_Identifier_Field) {
			Unique_Identifier_Field = ldapUser.raw[Unique_Identifier_Field].toString('hex');
		}
		return Unique_Identifier_Field || fallback;
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

	let username;

	if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
		username = slug(ldapUser.object[RocketChat.settings.get('LDAP_Username_Field')]);
	} else {
		username = slug(loginRequest.username);
	}

	// Look to see if user already exists
	let userQuery;

	let Unique_Identifier_Field = getLdapUserUniqueID(ldapUser, username);
	if (Unique_Identifier_Field) {
		userQuery = {
			'services.ldap.id': Unique_Identifier_Field
		};
	} else {
		userQuery = {
			username: username
		};
	}

	const user = Meteor.users.findOne(userQuery);

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

		syncUserData(user, ldapUser, loginRequest.ldapPass);
		Accounts.setPassword(user._id, loginRequest.ldapPass, {logout: false});
		return {
			userId: user._id,
			token: stampedToken.token
		};
	}

	// Create new user
	var userObject = {
		username: username,
		password: loginRequest.ldapPass
	};

	let userData = getDataToSyncUserData(ldapUser);

	if (userData && userData.emails) {
		userObject.email = userData.emails[0].address;
	} else if (ldapUser.object.mail && ldapUser.object.mail.indexOf('@') > -1) {
		userObject.email = ldapUser.object.mail;
	} else if (RocketChat.settings.get('LDAP_Default_Domain') !== '') {
		userObject.email = username + '@' + RocketChat.settings.get('LDAP_Default_Domain');
	} else {
		throw new Meteor.Error("LDAP-login-error", "LDAP Authentication succeded, there is no email to create an account.");
	}

	userObject._id = Accounts.createUser(userObject);

	syncUserData(userObject, ldapUser, loginRequest.ldapPass);

	let ldapUserService = {
		ldap: true
	};

	if (Unique_Identifier_Field) {
		ldapUserService['services.ldap.id'] = Unique_Identifier_Field;
	}

	Meteor.users.update(userObject._id, {
		$set: ldapUserService
	});

	Meteor.runAsUser(userObject._id, function() {
		Meteor.call('joinDefaultChannels');
	});

	return {
		userId: userObject._id
	};
});
