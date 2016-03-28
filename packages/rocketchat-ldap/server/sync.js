/* globals slug:true, slugify, LDAP, getLdapUsername:true, getLdapUserUniqueID:true, getDataToSyncUserData:true, syncUserData:true, sync:true  */

const logger = new Logger('LDAPSync', {});

slug = function slug(text) {
	if (RocketChat.settings.get('UTF8_Names_Slugify') !== true) {
		return text;
	}
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
};


getLdapUsername = function getLdapUsername(ldapUser) {
	let usernameField = RocketChat.settings.get('LDAP_Username_Field');

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

		if (_.size(userData)) {
			return userData;
		}
	}
};


syncUserData = function syncUserData(user, ldapUser) {
	logger.info('Syncing user data');
	logger.debug('user', user);
	logger.debug('ldapUser', ldapUser);

	const userData = getDataToSyncUserData(ldapUser, user);
	if (user && user._id && userData) {
		Meteor.users.update(user._id, { $set: userData });
		user = Meteor.users.findOne({_id: user._id});
		logger.debug('setting', JSON.stringify(userData, null, 2));
	}

	const username = slug(getLdapUsername(ldapUser));
	if (user && user._id && username !== user.username) {
		logger.info('Syncing user username', user.username, '->', username);
		RocketChat._setUsername(user._id, username);
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
					RocketChat.Notifications.notifyAll('updateAvatar', {username: user.username});
				}, 500);
			}));
			rs.pipe(ws);
		}
	}
};


sync = function sync() {
	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return;
	}

	const ldap = new LDAP();

	try {
		ldap.connectSync();

		const users = RocketChat.models.Users.findLDAPUsers();

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
	} catch(error) {
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
		}, 1000 * 30);
	} else {
		logger.info('Disabling LDAP user sync');
	}
});
