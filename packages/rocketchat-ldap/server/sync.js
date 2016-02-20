const logger = new Logger('LDAPSync', {});

getLdapUserUniqueID = function getLdapUserUniqueID(ldapUser, fallbackAttribute, fallbackValue) {
	let Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field');

	if (Unique_Identifier_Field !== '') {
		Unique_Identifier_Field = Unique_Identifier_Field.split(',').find((field) => {
			return !_.isEmpty(ldapUser.object[field]);
		});
		if (Unique_Identifier_Field) {
			Unique_Identifier_Field = {
				attribute: Unique_Identifier_Field,
				value: ldapUser.raw[Unique_Identifier_Field].toString('hex')
			};
		}
		return Unique_Identifier_Field || {attribute: fallbackAttribute, value: fallbackValue};
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

		const uniqueId = getLdapUserUniqueID(ldapUser, 'username', user.username);

		if (!user.services || !user.services.ldap || user.services.ldap.id !== uniqueId.value || user.services.ldap.idAttribute !== uniqueId.attribute) {
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
		logger.debug('setting', JSON.stringify(userData, null, 2));
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

		users = RocketChat.models.Users.findLDAPUsers();

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
let timer;

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
