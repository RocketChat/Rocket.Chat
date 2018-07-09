/* globals slugify, SyncedCron */

import _ from 'underscore';
import LDAP from './ldap';

const logger = new Logger('LDAPSync', {});

export function slug(text) {
	if (RocketChat.settings.get('UTF8_Names_Slugify') !== true) {
		return text;
	}
	text = slugify(text, '.');
	return text.replace(/[^0-9a-z-_.]/g, '');
}


export function getPropertyValue(obj, key) {
	try {
		return _.reduce(key.split('.'), (acc, el) => acc[el], obj);
	} catch (err) {
		return undefined;
	}
}


export function getLdapUsername(ldapUser) {
	const usernameField = RocketChat.settings.get('LDAP_Username_Field');

	if (usernameField.indexOf('#{') > -1) {
		return usernameField.replace(/#{(.+?)}/g, function(match, field) {
			return ldapUser[field];
		});
	}

	return ldapUser[usernameField];
}


export function getLdapUserUniqueID(ldapUser) {
	let Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field');

	if (Unique_Identifier_Field !== '') {
		Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
	} else {
		Unique_Identifier_Field = [];
	}

	let User_Search_Field = RocketChat.settings.get('LDAP_User_Search_Field');

	if (User_Search_Field !== '') {
		User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',');
	} else {
		User_Search_Field = [];
	}

	Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field);

	if (Unique_Identifier_Field.length > 0) {
		Unique_Identifier_Field = Unique_Identifier_Field.find((field) => {
			return !_.isEmpty(ldapUser._raw[field]);
		});
		if (Unique_Identifier_Field) {
			Unique_Identifier_Field = {
				attribute: Unique_Identifier_Field,
				value: ldapUser._raw[Unique_Identifier_Field].toString('hex')
			};
		}
		return Unique_Identifier_Field;
	}
}

export function getDataToSyncUserData(ldapUser, user) {
	const syncUserData = RocketChat.settings.get('LDAP_Sync_User_Data');
	const syncUserDataFieldMap = RocketChat.settings.get('LDAP_Sync_User_Data_FieldMap').trim();

	const userData = {};

	if (syncUserData && syncUserDataFieldMap) {
		const whitelistedUserFields = ['email', 'name', 'customFields'];
		const fieldMap = JSON.parse(syncUserDataFieldMap);
		const emailList = [];
		_.map(fieldMap, function(userField, ldapField) {
			switch (userField) {
				case 'email':
					if (!ldapUser.hasOwnProperty(ldapField)) {
						logger.debug(`user does not have attribute: ${ ldapField }`);
						return;
					}

					if (_.isObject(ldapUser[ldapField])) {
						_.map(ldapUser[ldapField], function(item) {
							emailList.push({ address: item, verified: true });
						});
					} else {
						emailList.push({ address: ldapUser[ldapField], verified: true });
					}
					break;

				default:
					const [outerKey, innerKeys] = userField.split(/\.(.+)/);

					if (!_.find(whitelistedUserFields, (el) => el === outerKey)) {
						logger.debug(`user attribute not whitelisted: ${ userField }`);
						return;
					}

					if (outerKey === 'customFields') {
						let customFieldsMeta;

						try {
							customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
						} catch (e) {
							logger.debug('Invalid JSON for Custom Fields');
							return;
						}

						if (!getPropertyValue(customFieldsMeta, innerKeys)) {
							logger.debug(`user attribute does not exist: ${ userField }`);
							return;
						}
					}

					const tmpUserField = getPropertyValue(user, userField);
					const tmpLdapField = RocketChat.templateVarHandler(ldapField, ldapUser);

					if (tmpLdapField && tmpUserField !== tmpLdapField) {
						// creates the object structure instead of just assigning 'tmpLdapField' to
						// 'userData[userField]' in order to avoid the "cannot use the part (...)
						// to traverse the element" (MongoDB) error that can happen. Do not handle
						// arrays.
						// TODO: Find a better solution.
						const dKeys = userField.split('.');
						const lastKey = _.last(dKeys);
						_.reduce(dKeys, (obj, currKey) =>
							(currKey === lastKey)
								? obj[currKey] = tmpLdapField
								: obj[currKey] = obj[currKey] || {}
							, userData);
						logger.debug(`user.${ userField } changed to: ${ tmpLdapField }`);
					}
			}
		});

		if (emailList.length > 0) {
			if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
				userData.emails = emailList;
			}
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


export function syncUserData(user, ldapUser) {
	logger.info('Syncing user data');
	logger.debug('user', {'email': user.email, '_id': user._id});
	logger.debug('ldapUser', ldapUser.object);

	const userData = getDataToSyncUserData(ldapUser, user);
	if (user && user._id && userData) {
		logger.debug('setting', JSON.stringify(userData, null, 2));
		if (userData.name) {
			RocketChat._setRealName(user._id, userData.name);
			delete userData.name;
		}
		Meteor.users.update(user._id, { $set: userData });
		user = Meteor.users.findOne({_id: user._id});
	}

	if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
		const username = slug(getLdapUsername(ldapUser));
		if (user && user._id && username !== user.username) {
			logger.info('Syncing user username', user.username, '->', username);
			RocketChat._setUsername(user._id, username);
		}
	}

	if (user && user._id && RocketChat.settings.get('LDAP_Sync_User_Avatar') === true) {
		const avatar = ldapUser._raw.thumbnailPhoto || ldapUser._raw.jpegPhoto;
		if (avatar) {
			logger.info('Syncing user avatar');

			const rs = RocketChatFile.bufferToStream(avatar);
			const fileStore = FileUpload.getStore('Avatars');
			fileStore.deleteByName(user.username);

			const file = {
				userId: user._id,
				type: 'image/jpeg'
			};

			Meteor.runAsUser(user._id, () => {
				fileStore.insert(file, rs, () => {
					Meteor.setTimeout(function() {
						RocketChat.models.Users.setAvatarOrigin(user._id, 'ldap');
						RocketChat.Notifications.notifyLogged('updateAvatar', {username: user.username});
					}, 500);
				});
			});
		}
	}
}

export function addLdapUser(ldapUser, username, password) {
	const uniqueId = getLdapUserUniqueID(ldapUser);

	const userObject = {};

	if (username) {
		userObject.username = username;
	}

	const userData = getDataToSyncUserData(ldapUser, {});

	if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
		if (Array.isArray(userData.emails[0].address)) {
			userObject.email = userData.emails[0].address[0];
		} else {
			userObject.email = userData.emails[0].address;
		}
	} else if (ldapUser.mail && ldapUser.mail.indexOf('@') > -1) {
		userObject.email = ldapUser.mail;
	} else if (RocketChat.settings.get('LDAP_Default_Domain') !== '') {
		userObject.email = `${ username || uniqueId.value }@${ RocketChat.settings.get('LDAP_Default_Domain') }`;
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
		return error;
	}

	syncUserData(userObject, ldapUser);

	return {
		userId: userObject._id
	};
}

export function importNewUsers(ldap) {
	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		logger.error('Can\'t run LDAP Import, LDAP is disabled');
		return;
	}

	if (!ldap) {
		ldap = new LDAP();
		ldap.connectSync();
	}

	let count = 0;
	ldap.searchUsersSync('*', Meteor.bindEnvironment((error, ldapUsers, {next, end} = {}) => {
		if (error) {
			throw error;
		}

		ldapUsers.forEach((ldapUser) => {
			count++;

			const uniqueId = getLdapUserUniqueID(ldapUser);
			// Look to see if user already exists
			const userQuery = {
				'services.ldap.id': uniqueId.value
			};

			logger.debug('userQuery', userQuery);

			let username;
			if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
				username = slug(getLdapUsername(ldapUser));
			}

			// Add user if it was not added before
			let user = Meteor.users.findOne(userQuery);

			if (!user && username && RocketChat.settings.get('LDAP_Merge_Existing_Users') === true) {
				const userQuery = {
					username
				};

				logger.debug('userQuery merge', userQuery);

				user = Meteor.users.findOne(userQuery);
				if (user) {
					syncUserData(user, ldapUser);
				}
			}

			if (!user) {
				addLdapUser(ldapUser, username);
			}

			if (count % 100 === 0) {
				logger.info('Import running. Users imported until now:', count);
			}
		});

		if (end) {
			logger.info('Import finished. Users imported:', count);
		}

		next(count);
	}));
}

function sync() {
	if (RocketChat.settings.get('LDAP_Enable') !== true) {
		return;
	}

	const ldap = new LDAP();

	try {
		ldap.connectSync();

		let users;
		if (RocketChat.settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
			users = RocketChat.models.Users.findLDAPUsers();
		}

		if (RocketChat.settings.get('LDAP_Background_Sync_Import_New_Users') === true) {
			importNewUsers(ldap);
		}

		if (RocketChat.settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
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
		}
	} catch (error) {
		logger.error(error);
		return error;
	}
	return true;
}

const jobName = 'LDAP_Sync';

const addCronJob = _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
	if (RocketChat.settings.get('LDAP_Background_Sync') !== true) {
		logger.info('Disabling LDAP Background Sync');
		if (SyncedCron.nextScheduledAtDate(jobName)) {
			SyncedCron.remove(jobName);
		}
		return;
	}

	if (RocketChat.settings.get('LDAP_Background_Sync_Interval')) {
		logger.info('Enabling LDAP Background Sync');
		SyncedCron.add({
			name: jobName,
			schedule: (parser) => parser.text(RocketChat.settings.get('LDAP_Background_Sync_Interval')),
			job() {
				sync();
			}
		});
		SyncedCron.start();
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		RocketChat.settings.get('LDAP_Background_Sync', addCronJob);
		RocketChat.settings.get('LDAP_Background_Sync_Interval', addCronJob);
	});
});
