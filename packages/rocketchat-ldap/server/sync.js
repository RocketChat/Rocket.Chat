/* globals slug:true, slugify, LDAP, getLdapUsername:true, getLdapUserUniqueID:true, getDataToSyncUserData:true, syncUserData:true, sync:true, addLdapUser:true  */

const logger = new Logger('LDAPSync', {});

slug = function slug(text) {
	if (RocketChat.settings.get('UTF8_Names_Slugify') !== true) {
		return text;
	}
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
};


getLdapUsername = function getLdapUsername(ldapUser) {
	const usernameField = RocketChat.settings.get('LDAP_Username_Field');

	if (usernameField.indexOf('#{') > -1) {
		return usernameField.replace(/#{(.+?)}/g, function(match, field) {
			return ldapUser.object[field];
		});
	}

	return ldapUser.object[usernameField];
};


getLdapUserUniqueID = function getLdapUserUniqueID(ldapUser) {
	let Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field');

	if (Unique_Identifier_Field !== '') {
		Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
	} else {
		Unique_Identifier_Field = [];
	}

	let LDAP_Domain_Search_User_ID = RocketChat.settings.get('LDAP_Domain_Search_User_ID');

	if (LDAP_Domain_Search_User_ID !== '') {
		LDAP_Domain_Search_User_ID = LDAP_Domain_Search_User_ID.replace(/\s/g, '').split(',');
	} else {
		LDAP_Domain_Search_User_ID = [];
	}

	Unique_Identifier_Field = Unique_Identifier_Field.concat(LDAP_Domain_Search_User_ID);

	if (Unique_Identifier_Field.length > 0) {
		Unique_Identifier_Field = Unique_Identifier_Field.find((field) => {
			return !_.isEmpty(ldapUser.object[field]);
		});
		if (Unique_Identifier_Field) {
			Unique_Identifier_Field = {
				attribute: Unique_Identifier_Field,
				value: ldapUser.raw[Unique_Identifier_Field].toString('hex')
			};
		}
		return Unique_Identifier_Field;
	}
};


getDataToSyncUserData = function getDataToSyncUserData(ldapUser, user) {
	const syncUserData = RocketChat.settings.get('LDAP_Sync_User_Data');
	const syncUserDataFieldMap = RocketChat.settings.get('LDAP_Sync_User_Data_FieldMap').trim();

	if (syncUserData && syncUserDataFieldMap) {
		const fieldMap = JSON.parse(syncUserDataFieldMap);
		const userData = {};

		const emailList = [];
		_.map(fieldMap, function(userField, ldapField) {
			if (!ldapUser.object.hasOwnProperty(ldapField)) {
				return;
			}

			switch (userField) {
				case 'email':
					if (_.isObject(ldapUser.object[ldapField])) {
						_.map(ldapUser.object[ldapField], function(item) {
							emailList.push({ address: item, verified: true });
						});
					} else {
						emailList.push({ address: ldapUser.object[ldapField], verified: true });
					}
					break;

				case 'name':
					if (user.name !== ldapUser.object[ldapField]) {
						userData.name = ldapUser.object[ldapField];
					}
					break;
			}
		});

		if (emailList.length > 0) {
			if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
				userData.emails = emailList;
			}
		}

		const uniqueId = getLdapUserUniqueID(ldapUser);

		if (uniqueId && (!user.services || !user.services.ldap || user.services.ldap.id !== uniqueId.value || user.services.ldap.idAttribute !== uniqueId.attribute)) {
			userData['services.ldap.id'] = uniqueId.value;
			userData['services.ldap.idAttribute'] = uniqueId.attribute;
		}

		if (user.ldap !== true) {
			userData.ldap = true;
		}

		if (_.size(userData)) {
			return userData;
		}
	}
};


syncUserData = function syncUserData(user, ldapUser) {
	logger.info('Syncing user data');
	logger.debug('user', {'email': user.email, '_id': user._id});
	logger.debug('ldapUser', ldapUser);

	const userData = getDataToSyncUserData(ldapUser, user);
	if (user && user._id && userData) {
		Meteor.users.update(user._id, { $set: userData });
		user = Meteor.users.findOne({_id: user._id});
		logger.debug('setting', JSON.stringify(userData, null, 2));
	}

	if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
		const username = slug(getLdapUsername(ldapUser));
		if (user && user._id && username !== user.username) {
			logger.info('Syncing user username', user.username, '->', username);
			RocketChat._setUsername(user._id, username);
		}
	}

	if (user && user._id && RocketChat.settings.get('LDAP_Sync_User_Avatar') === true) {
		const avatar = ldapUser.raw.thumbnailPhoto || ldapUser.raw.jpegPhoto;
		if (avatar) {
			logger.info('Syncing user avatar');
			const rs = RocketChatFile.bufferToStream(avatar);
			RocketChatFileAvatarInstance.deleteFile(encodeURIComponent(`${user.username}.jpg`));
			const ws = RocketChatFileAvatarInstance.createWriteStream(encodeURIComponent(`${user.username}.jpg`), 'image/jpeg');
			ws.on('end', Meteor.bindEnvironment(function() {
				Meteor.setTimeout(function() {
					RocketChat.models.Users.setAvatarOrigin(user._id, 'ldap');
					RocketChat.Notifications.notifyLogged('updateAvatar', {username: user.username});
				}, 500);
			}));
			rs.pipe(ws);
		}
	}
};

addLdapUser = function addLdapUser(ldapUser, username, password) {
	var userObject = {
		username: username
	};

	const userData = getDataToSyncUserData(ldapUser, {});

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

	if (password) {
		userObject.password = password;
	}

	try {
		userObject._id = Accounts.createUser(userObject);
	} catch (error) {
		logger.error('Error creating user', error);
		throw error;
	}

	syncUserData(userObject, ldapUser);

	return {
		userId: userObject._id
	};
};

sync = function sync() {
	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return;
	}

	const ldap = new LDAP();

	try {
		ldap.connectSync();

		const users = RocketChat.models.Users.findLDAPUsers();

		if (RocketChat.settings.get('LDAP_Import_Users') === true && RocketChat.settings.get('LDAP_Username_Field') !== '') {
			const ldapUsers = ldap.searchUsersSync('*');
			ldapUsers.forEach(function(ldapUser) {
				const username = slug(getLdapUsername(ldapUser));
				// Look to see if user already exists
				const userQuery = {
					username: username
				};

				logger.debug('userQuery', userQuery);

				const user = Meteor.users.findOne(userQuery);

				if (!user) {
					addLdapUser(ldapUser, username);
				} else if (user.ldap !== true && RocketChat.settings.get('LDAP_Merge_Existing_Users') === true) {
					syncUserData(user, ldapUser);
				}
			});
		}

		users.forEach(function(user) {
			let ldapUser;

			if (user.services && user.services.ldap && user.services.ldap.id) {
				ldapUser = ldap.getUserByIdSync(user.services.ldap.id, user.services.ldap.idAttribute);
			} else {
				ldapUser = ldap.getUserByUsernameSync(user.username);
			}

			if (ldapUser) {
				syncUserData(user, ldapUser);
			} else {
				logger.info('Can\'t sync user', user.username);
			}
		});
	} catch (error) {
		logger.error(error);
		return error;
	}

	ldap.disconnect();
	return true;
};

let interval;
let timeout;

RocketChat.settings.get('LDAP_Sync_User_Data', function(key, value) {
	Meteor.clearInterval(interval);
	Meteor.clearTimeout(timeout);

	if (value === true) {
		logger.info('Enabling LDAP user sync');
		interval = Meteor.setInterval(sync, 1000 * 60 * 60);
		timeout = Meteor.setTimeout(function() {
			sync();
		}, 1000 * 60 * 10);
	} else {
		logger.info('Disabling LDAP user sync');
	}
});
