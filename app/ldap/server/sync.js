import limax from 'limax';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import _ from 'underscore';

import LDAP from './ldap';
import { callbacks } from '../../callbacks/server';
import { RocketChatFile } from '../../file';
import { settings } from '../../settings';
import { Users, Roles, Rooms, Subscriptions } from '../../models';
import { Logger } from '../../logger';
import { _setRealName } from '../../lib';
import { templateVarHandler } from '../../utils';
import { FileUpload } from '../../file-upload';
import { addUserToRoom, removeUserFromRoom, createRoom, saveUserIdentity } from '../../lib/server/functions';
import { api } from '../../../server/sdk/api';

export const logger = new Logger('LDAPSync', {});

export function isUserInLDAPGroup(ldap, ldapUser, user, ldapGroup) {
	const syncUserRolesFilter = settings.get('LDAP_Sync_User_Data_Groups_Filter').trim();
	const syncUserRolesBaseDN = settings.get('LDAP_Sync_User_Data_Groups_BaseDN').trim();

	if (!syncUserRolesFilter || !syncUserRolesBaseDN) {
		logger.error('Please setup LDAP Group Filter and LDAP Group BaseDN in LDAP Settings.');
		return false;
	}
	const searchOptions = {
		filter: syncUserRolesFilter.replace(/#{username}/g, user.username).replace(/#{groupName}/g, ldapGroup).replace(/#{userdn}/g, ldapUser.dn),
		scope: 'sub',
	};

	const result = ldap.searchAllSync(syncUserRolesBaseDN, searchOptions);
	if (!Array.isArray(result) || result.length === 0) {
		logger.debug(`${ user.username } is not in ${ ldapGroup } group!!!`);
	} else {
		logger.debug(`${ user.username } is in ${ ldapGroup } group.`);
		return true;
	}

	return false;
}

export function slug(text) {
	if (settings.get('UTF8_Names_Slugify') !== true) {
		return text;
	}
	text = limax(text, { replacement: '.' });
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
	const usernameField = settings.get('LDAP_Username_Field');

	if (usernameField.indexOf('#{') > -1) {
		return usernameField.replace(/#{(.+?)}/g, function(match, field) {
			return ldapUser[field];
		});
	}

	return ldapUser[usernameField];
}


export function getLdapUserUniqueID(ldapUser) {
	let Unique_Identifier_Field = settings.get('LDAP_Unique_Identifier_Field');

	if (Unique_Identifier_Field !== '') {
		Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
	} else {
		Unique_Identifier_Field = [];
	}

	let User_Search_Field = settings.get('LDAP_User_Search_Field');

	if (User_Search_Field !== '') {
		User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',');
	} else {
		User_Search_Field = [];
	}

	Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field);

	if (Unique_Identifier_Field.length > 0) {
		Unique_Identifier_Field = Unique_Identifier_Field.find((field) => !_.isEmpty(ldapUser._raw[field]));
		if (Unique_Identifier_Field) {
			Unique_Identifier_Field = {
				attribute: Unique_Identifier_Field,
				value: ldapUser._raw[Unique_Identifier_Field].toString('hex'),
			};
		}
		return Unique_Identifier_Field;
	}
}

export function getDataToSyncUserData(ldapUser, user) {
	const syncUserData = settings.get('LDAP_Sync_User_Data');
	const syncUserDataFieldMap = settings.get('LDAP_Sync_User_Data_FieldMap').trim();

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

					const verified = settings.get('Accounts_Verify_Email_For_External_Accounts');

					if (_.isObject(ldapUser[ldapField])) {
						_.map(ldapUser[ldapField], function(item) {
							emailList.push({ address: item, verified });
						});
					} else {
						emailList.push({ address: ldapUser[ldapField], verified });
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
							customFieldsMeta = JSON.parse(settings.get('Accounts_CustomFields'));
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
					const tmpLdapField = templateVarHandler(ldapField, ldapUser);

					if (tmpLdapField && tmpUserField !== tmpLdapField) {
						// creates the object structure instead of just assigning 'tmpLdapField' to
						// 'userData[userField]' in order to avoid the "cannot use the part (...)
						// to traverse the element" (MongoDB) error that can happen. Do not handle
						// arrays.
						// TODO: Find a better solution.
						const dKeys = userField.split('.');
						const lastKey = _.last(dKeys);
						_.reduce(dKeys, (obj, currKey) => {
							if (currKey === lastKey) {
								obj[currKey] = tmpLdapField;
							} else {
								obj[currKey] = obj[currKey] || {};
							}
							return obj[currKey];
						}, userData);
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
export function mapLdapGroupsToUserRoles(ldap, ldapUser, user) {
	const syncUserRoles = settings.get('LDAP_Sync_User_Data_Groups');
	const syncUserRolesAutoRemove = settings.get('LDAP_Sync_User_Data_Groups_AutoRemove');
	const syncUserRolesFieldMap = settings.get('LDAP_Sync_User_Data_GroupsMap').trim();

	if (!syncUserRoles || !syncUserRolesFieldMap) {
		logger.debug('not syncing user roles');
		return [];
	}

	const roles = Roles.find({}, {
		fields: {
			_updatedAt: 0,
		},
	}).fetch();

	if (!roles) {
		return [];
	}

	let fieldMap;

	try {
		fieldMap = JSON.parse(syncUserRolesFieldMap);
	} catch (err) {
		logger.error(`Unexpected error : ${ err.message }`);
		return [];
	}
	if (!fieldMap) {
		return [];
	}

	const userRoles = [];

	for (const ldapField in fieldMap) {
		if (!fieldMap.hasOwnProperty(ldapField)) {
			continue;
		}

		const userField = fieldMap[ldapField];

		const [roleName] = userField.split(/\.(.+)/);
		if (!_.find(roles, (el) => el._id === roleName)) {
			logger.debug(`User Role doesn't exist: ${ roleName }`);
			continue;
		}

		logger.debug(`User role exists for mapping ${ ldapField } -> ${ roleName }`);

		if (isUserInLDAPGroup(ldap, ldapUser, user, ldapField)) {
			userRoles.push(roleName);
			continue;
		}

		if (!syncUserRolesAutoRemove) {
			continue;
		}

		const del = Roles.removeUserRoles(user._id, roleName);
		if (settings.get('UI_DisplayRoles') && del) {
			api.broadcast('user.roleUpdate', {
				type: 'removed',
				_id: roleName,
				u: {
					_id: user._id,
					username: user.username,
				},
			});
		}
	}

	return userRoles;
}
export function createRoomForSync(channel) {
	logger.info(`Channel '${ channel }' doesn't exist, creating it.`);

	const room = createRoom('c', channel, settings.get('LDAP_Sync_User_Data_Groups_AutoChannels_Admin'), [], false, { customFields: { ldap: true } });
	if (!room || !room.rid) {
		logger.error(`Unable to auto-create channel '${ channel }' during ldap sync.`);
		return;
	}
	room._id = room.rid;
	return room;
}

export function mapLDAPGroupsToChannels(ldap, ldapUser, user) {
	const syncUserRoles = settings.get('LDAP_Sync_User_Data_Groups');
	const syncUserRolesAutoChannels = settings.get('LDAP_Sync_User_Data_Groups_AutoChannels');
	const syncUserRolesEnforceAutoChannels = settings.get('LDAP_Sync_User_Data_Groups_Enforce_AutoChannels');
	const syncUserRolesChannelFieldMap = settings.get('LDAP_Sync_User_Data_Groups_AutoChannelsMap').trim();

	const userChannels = [];
	if (!syncUserRoles || !syncUserRolesAutoChannels || !syncUserRolesChannelFieldMap) {
		logger.debug('not syncing groups to channels');
		return [];
	}

	let fieldMap;
	try {
		fieldMap = JSON.parse(syncUserRolesChannelFieldMap);
	} catch (err) {
		logger.error(`Unexpected error : ${ err.message }`);
		return [];
	}

	if (!fieldMap) {
		return [];
	}

	_.map(fieldMap, function(channels, ldapField) {
		if (!Array.isArray(channels)) {
			channels = [channels];
		}

		for (const channel of channels) {
			let room = Rooms.findOneByNonValidatedName(channel);

			if (!room) {
				room = createRoomForSync(channel);
			}
			if (isUserInLDAPGroup(ldap, ldapUser, user, ldapField)) {
				if (room.teamMain) {
					logger.error(`Can't add user to channel ${ channel } because it is a team.`);
				} else {
					userChannels.push(room._id);
				}
			} else if (syncUserRolesEnforceAutoChannels && !room.teamMain) {
				const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
				if (subscription) {
					removeUserFromRoom(room._id, user);
				}
			}
		}
	});

	return userChannels;
}

function syncUserAvatar(user, ldapUser) {
	if (!user?._id || settings.get('LDAP_Sync_User_Avatar') !== true) {
		return;
	}

	const avatarField = (settings.get('LDAP_Avatar_Field') || 'thumbnailPhoto').trim();
	const avatar = ldapUser._raw[avatarField] || ldapUser._raw.thumbnailPhoto || ldapUser._raw.jpegPhoto;
	if (!avatar) {
		return;
	}

	logger.info('Syncing user avatar');

	Meteor.defer(() => {
		const rs = RocketChatFile.bufferToStream(avatar);
		const fileStore = FileUpload.getStore('Avatars');
		fileStore.deleteByName(user.username);

		const file = {
			userId: user._id,
			type: 'image/jpeg',
			size: avatar.length,
		};

		Meteor.runAsUser(user._id, () => {
			fileStore.insert(file, rs, (err, result) => {
				Meteor.setTimeout(function() {
					Users.setAvatarData(user._id, 'ldap', result.etag);
					api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: result.etag });
				}, 500);
			});
		});
	});
}

export function syncUserData(user, ldapUser, ldap) {
	logger.info('Syncing user data');
	logger.debug('user', { email: user.email, _id: user._id });
	logger.debug('ldapUser', ldapUser.object);

	const userData = getDataToSyncUserData(ldapUser, user);

	// Returns a list of Rocket.Chat Groups a user should belong
	// to if their LDAP group matches the LDAP_Sync_User_Data_GroupsMap
	const userRoles = mapLdapGroupsToUserRoles(ldap, ldapUser, user);

	// Returns a list of Rocket.Chat Channels a user should belong
	// to if their LDAP group matches the LDAP_Sync_User_Data_Groups_AutoChannelsMap
	const userChannels = mapLDAPGroupsToChannels(ldap, ldapUser, user);

	if (user && user._id && userData) {
		logger.debug('setting', JSON.stringify(userData, null, 2));
		if (userData.name) {
			_setRealName(user._id, userData.name);
			delete userData.name;
		}
		userData.customFields = {
			...user.customFields, ...userData.customFields,
		};
		Meteor.users.update(user._id, { $set: userData });
		user = Meteor.users.findOne({ _id: user._id });
	}

	if (settings.get('LDAP_Username_Field') !== '') {
		const username = slug(getLdapUsername(ldapUser));
		if (user && user._id && username !== user.username) {
			logger.info('Syncing user username', user.username, '->', username);
			saveUserIdentity({ _id: user._id, username });
		}
	}

	if (settings.get('LDAP_Sync_User_Data_Groups') === true) {
		for (const roleName of userRoles) {
			const add = Roles.addUserRoles(user._id, roleName);
			if (settings.get('UI_DisplayRoles') && add) {
				api.broadcast('user.roleUpdate', {
					type: 'added',
					_id: roleName,
					u: {
						_id: user._id,
						username: user.username,
					},
				});
			}
			logger.info('Synced user group', roleName, 'from LDAP for', user.username);
		}
	}

	if (settings.get('LDAP_Sync_User_Data_Groups_AutoChannels') === true) {
		for (const userChannel of userChannels) {
			addUserToRoom(userChannel, user);
			logger.info('Synced user channel', userChannel, 'from LDAP for', user.username);
		}
	}

	syncUserAvatar(user, ldapUser);
}

export function addLdapUser(ldapUser, username, password, ldap) {
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
	} else if (settings.get('LDAP_Default_Domain') !== '') {
		userObject.email = `${ username || uniqueId.value }@${ settings.get('LDAP_Default_Domain') }`;
	} else {
		const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?');
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

	syncUserData(userObject, ldapUser, ldap);

	return {
		userId: userObject._id,
	};
}

export function importNewUsers(ldap) {
	if (settings.get('LDAP_Enable') !== true) {
		logger.error('Can\'t run LDAP Import, LDAP is disabled');
		return;
	}

	if (!ldap) {
		ldap = new LDAP();
	}

	if (!ldap.connected) {
		ldap.connectSync();
	}

	let count = 0;
	ldap.searchUsersSync('*', Meteor.bindEnvironment((error, ldapUsers, { next, end } = {}) => {
		if (error) {
			throw error;
		}

		ldapUsers.forEach((ldapUser) => {
			count++;

			const uniqueId = getLdapUserUniqueID(ldapUser);
			// Look to see if user already exists
			const userQuery = {
				'services.ldap.id': uniqueId.value,
			};

			logger.debug('userQuery', userQuery);

			let username;
			if (settings.get('LDAP_Username_Field') !== '') {
				username = slug(getLdapUsername(ldapUser));
			}

			// Add user if it was not added before
			let user = Meteor.users.findOne(userQuery);

			if (!user && username && settings.get('LDAP_Merge_Existing_Users') === true) {
				const userQuery = {
					username,
				};

				logger.debug('userQuery merge', userQuery);

				user = Meteor.users.findOne(userQuery);
				if (user) {
					syncUserData(user, ldapUser, ldap);
				}
			}

			if (!user) {
				addLdapUser(ldapUser, username, undefined, ldap);
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

export function sync() {
	if (settings.get('LDAP_Enable') !== true) {
		return;
	}

	const ldap = new LDAP();

	try {
		ldap.connectSync();

		let users;
		if (settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
			users = Users.findLDAPUsers();
		}

		if (settings.get('LDAP_Background_Sync_Import_New_Users') === true) {
			importNewUsers(ldap);
		}

		if (settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
			users.forEach(function(user) {
				let ldapUser;

				if (user.services && user.services.ldap && user.services.ldap.id) {
					ldapUser = ldap.getUserByIdSync(user.services.ldap.id, user.services.ldap.idAttribute);
				} else {
					ldapUser = ldap.getUserByUsernameSync(user.username);
				}

				if (ldapUser) {
					syncUserData(user, ldapUser, ldap);
				}

				callbacks.run('ldap.afterSyncExistentUser', { ldapUser, user });
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
	if (settings.get('LDAP_Background_Sync') !== true) {
		logger.info('Disabling LDAP Background Sync');
		if (SyncedCron.nextScheduledAtDate(jobName)) {
			SyncedCron.remove(jobName);
		}
		return;
	}

	if (settings.get('LDAP_Background_Sync_Interval')) {
		logger.info('Enabling LDAP Background Sync');
		SyncedCron.add({
			name: jobName,
			schedule: (parser) => parser.text(settings.get('LDAP_Background_Sync_Interval')),
			job() {
				sync();
			},
		});
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		settings.get('LDAP_Background_Sync', addCronJob);
		settings.get('LDAP_Background_Sync_Interval', addCronJob);
	});
});
