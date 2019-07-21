import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import Busboy from 'busboy';

import { Users, Subscriptions } from '../../../models/server';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { getURL } from '../../../utils';
import {
	validateCustomFields,
	saveUser,
	saveCustomFieldsWithoutValidation,
	checkUsernameAvailability,
	setUserAvatar,
	saveCustomFields,
} from '../../../lib';
import { getFullUserData } from '../../../lib/server/functions/getFullUserData';
import { API } from '../api';
import { setStatusText } from '../../../lib/server';

API.v1.addRoute('users.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			email: String,
			name: String,
			password: String,
			username: String,
			active: Match.Maybe(Boolean),
			roles: Match.Maybe(Array),
			joinDefaultChannels: Match.Maybe(Boolean),
			requirePasswordChange: Match.Maybe(Boolean),
			sendWelcomeEmail: Match.Maybe(Boolean),
			verified: Match.Maybe(Boolean),
			customFields: Match.Maybe(Object),
		});

		// New change made by pull request #5152
		if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
			this.bodyParams.joinDefaultChannels = true;
		}

		if (this.bodyParams.customFields) {
			validateCustomFields(this.bodyParams.customFields);
		}

		const newUserId = saveUser(this.userId, this.bodyParams);

		if (this.bodyParams.customFields) {
			saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
		}


		if (typeof this.bodyParams.active !== 'undefined') {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
			});
		}

		return API.v1.success({ user: Users.findOneById(newUserId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.delete', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'delete-user')) {
			return API.v1.unauthorized();
		}

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteUser', user._id);
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.deleteOwnAccount', { authRequired: true }, {
	post() {
		const { password } = this.bodyParams;
		if (!password) {
			return API.v1.failure('Body parameter "password" is required.');
		}
		if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteUserOwnAccount', password);
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.getAvatar', { authRequired: false }, {
	get() {
		const user = this.getUserFromParams();

		const url = getURL(`/avatar/${ user.username }`, { cdn: false, full: true });
		this.response.setHeader('Location', url);

		return {
			statusCode: 307,
			body: url,
		};
	},
});

API.v1.addRoute('users.setActiveStatus', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: String,
			activeStatus: Boolean,
		});

		if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.activeStatus);
		});
		return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields: { active: 1 } }) });
	},
});

API.v1.addRoute('users.getPresence', { authRequired: true }, {
	get() {
		if (this.isUserFromParams()) {
			const user = Users.findOneById(this.userId);
			return API.v1.success({
				presence: user.status,
				connectionStatus: user.statusConnection,
				lastLogin: user.lastLogin,
			});
		}

		const user = this.getUserFromParams();

		return API.v1.success({
			presence: user.status,
		});
	},
});

API.v1.addRoute('users.info', { authRequired: true }, {
	get() {
		const { username } = this.getUserFromParams();
		const { fields } = this.parseJsonQuery();

		const result = getFullUserData({
			userId: this.userId,
			filter: username,
			limit: 1,
		});
		if (!result || result.count() !== 1) {
			return API.v1.failure(`Failed to get the user data for the userId of "${ this.userId }".`);
		}
		const [user] = result.fetch();
		const myself = user._id === this.userId;
		if (fields.userRooms === 1 && (myself || hasPermission(this.userId, 'view-other-user-channels'))) {
			user.rooms = Subscriptions.findByUserId(user._id, {
				fields: {
					rid: 1,
					name: 1,
					t: 1,
					roles: 1,
				},
				sort: {
					t: 1,
					name: 1,
				},
			}).fetch();
		}

		return API.v1.success({
			user,
		});
	},
});

API.v1.addRoute('users.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-d-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const users = Users.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			users,
			count: users.length,
			offset,
			total: Users.find(query).count(),
		});
	},
});

API.v1.addRoute('users.register', { authRequired: false }, {
	post() {
		if (this.userId) {
			return API.v1.failure('Logged in users can not register again.');
		}

		// We set their username here, so require it
		// The `registerUser` checks for the other requirements
		check(this.bodyParams, Match.ObjectIncluding({
			username: String,
		}));

		if (!checkUsernameAvailability(this.bodyParams.username)) {
			return API.v1.failure('Username is already in use');
		}

		// Register the user
		const userId = Meteor.call('registerUser', this.bodyParams);

		// Now set their username
		Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));

		return API.v1.success({ user: Users.findOneById(userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.resetAvatar', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();

		if (user._id === this.userId) {
			Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
		} else {
			return API.v1.unauthorized();
		}

		return API.v1.success();
	},
});

API.v1.addRoute('users.setAvatar', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			avatarUrl: Match.Maybe(String),
			userId: Match.Maybe(String),
			username: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'users.setAvatar',
			});
		}

		let user;
		if (this.isUserFromParams()) {
			user = Meteor.users.findOne(this.userId);
		} else if (hasPermission(this.userId, 'edit-other-user-avatar')) {
			user = this.getUserFromParams();
		} else {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.avatarUrl) {
				setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
			} else {
				const busboy = new Busboy({ headers: this.request.headers });
				const fields = {};
				const getUserFromFormData = (fields) => {
					if (fields.userId) {
						return Users.findOneById(fields.userId, { _id: 1 });
					}
					if (fields.username) {
						return Users.findOneByUsernameIgnoringCase(fields.username, { _id: 1 });
					}
				};

				Meteor.wrapAsync((callback) => {
					busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
						if (fieldname !== 'image') {
							return callback(new Meteor.Error('invalid-field'));
						}
						const imageData = [];
						file.on('data', Meteor.bindEnvironment((data) => {
							imageData.push(data);
						}));

						file.on('end', Meteor.bindEnvironment(() => {
							const sentTheUserByFormData = fields.userId || fields.username;
							if (sentTheUserByFormData) {
								user = getUserFromFormData(fields);
								if (!user) {
									return callback(new Meteor.Error('error-invalid-user', 'The optional "userId" or "username" param provided does not match any users'));
								}
								const isAnotherUser = this.userId !== user._id;
								if (isAnotherUser && !hasPermission(this.userId, 'edit-other-user-info')) {
									return callback(new Meteor.Error('error-not-allowed', 'Not allowed'));
								}
							}
							setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
							callback();
						}));
					}));
					busboy.on('field', (fieldname, val) => {
						fields[fieldname] = val;
					});
					this.request.pipe(busboy);
				})();
			}
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.getStatus', { authRequired: true }, {
	get() {
		if (this.isUserFromParams()) {
			const user = Users.findOneById(this.userId);
			return API.v1.success({
				message: user.statusText,
				connectionStatus: user.statusConnection,
				status: user.status,
			});
		}

		const user = this.getUserFromParams();

		return API.v1.success({
			message: user.statusText,
			status: user.status,
		});
	},
});

API.v1.addRoute('users.setStatus', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			status: Match.Maybe(String),
			message: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change status is not allowed', {
				method: 'users.setStatus',
			});
		}

		let user;
		if (this.isUserFromParams()) {
			user = Meteor.users.findOne(this.userId);
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			user = this.getUserFromParams();
		} else {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.message) {
				setStatusText(user._id, this.bodyParams.message);
			}
			if (this.bodyParams.status) {
				const validStatus = ['online', 'away', 'offline', 'busy'];
				if (validStatus.includes(this.bodyParams.status)) {
					Meteor.users.update(this.userId, {
						$set: {
							status: this.bodyParams.status,
							statusDefault: this.bodyParams.status,
						},
					});
				} else {
					throw new Meteor.Error('error-invalid-status', 'Valid status types include online, away, offline, and busy.', {
						method: 'users.setStatus',
					});
				}
			}
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: String,
			data: Match.ObjectIncluding({
				email: Match.Maybe(String),
				name: Match.Maybe(String),
				password: Match.Maybe(String),
				username: Match.Maybe(String),
				statusText: Match.Maybe(String),
				active: Match.Maybe(Boolean),
				roles: Match.Maybe(Array),
				joinDefaultChannels: Match.Maybe(Boolean),
				requirePasswordChange: Match.Maybe(Boolean),
				sendWelcomeEmail: Match.Maybe(Boolean),
				verified: Match.Maybe(Boolean),
				customFields: Match.Maybe(Object),
			}),
		});

		const userData = _.extend({ _id: this.bodyParams.userId }, this.bodyParams.data);

		Meteor.runAsUser(this.userId, () => saveUser(this.userId, userData));

		if (this.bodyParams.data.customFields) {
			saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
		}

		if (typeof this.bodyParams.data.active !== 'undefined') {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
			});
		}

		return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.updateOwnBasicInfo', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			data: Match.ObjectIncluding({
				email: Match.Maybe(String),
				name: Match.Maybe(String),
				username: Match.Maybe(String),
				statusText: Match.Maybe(String),
				currentPassword: Match.Maybe(String),
				newPassword: Match.Maybe(String),
			}),
			customFields: Match.Maybe(Object),
		});

		const userData = {
			email: this.bodyParams.data.email,
			realname: this.bodyParams.data.name,
			username: this.bodyParams.data.username,
			statusText: this.bodyParams.data.statusText,
			newPassword: this.bodyParams.data.newPassword,
			typedPassword: this.bodyParams.data.currentPassword,
		};

		Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));

		return API.v1.success({ user: Users.findOneById(this.userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.createToken', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();
		let data;
		Meteor.runAsUser(this.userId, () => {
			data = Meteor.call('createToken', user._id);
		});
		return data ? API.v1.success({ data }) : API.v1.unauthorized();
	},
});

API.v1.addRoute('users.getPreferences', { authRequired: true }, {
	get() {
		const user = Users.findOneById(this.userId);
		if (user.settings) {
			const { preferences = {} } = user.settings;
			preferences.language = user.language;

			return API.v1.success({
				preferences,
			});
		}
		return API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
	},
});

API.v1.addRoute('users.setPreferences', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: Match.Maybe(String),
			data: Match.ObjectIncluding({
				newRoomNotification: Match.Maybe(String),
				newMessageNotification: Match.Maybe(String),
				clockMode: Match.Maybe(Number),
				useEmojis: Match.Maybe(Boolean),
				convertAsciiEmoji: Match.Maybe(Boolean),
				saveMobileBandwidth: Match.Maybe(Boolean),
				collapseMediaByDefault: Match.Maybe(Boolean),
				autoImageLoad: Match.Maybe(Boolean),
				emailNotificationMode: Match.Maybe(String),
				unreadAlert: Match.Maybe(Boolean),
				notificationsSoundVolume: Match.Maybe(Number),
				desktopNotifications: Match.Maybe(String),
				mobileNotifications: Match.Maybe(String),
				enableAutoAway: Match.Maybe(Boolean),
				highlights: Match.Maybe(Array),
				desktopNotificationDuration: Match.Maybe(Number),
				messageViewMode: Match.Maybe(Number),
				hideUsernames: Match.Maybe(Boolean),
				hideRoles: Match.Maybe(Boolean),
				hideAvatars: Match.Maybe(Boolean),
				hideFlexTab: Match.Maybe(Boolean),
				sendOnEnter: Match.Maybe(String),
				roomCounterSidebar: Match.Maybe(Boolean),
				language: Match.Maybe(String),
				sidebarShowFavorites: Match.Optional(Boolean),
				sidebarShowUnread: Match.Optional(Boolean),
				sidebarSortby: Match.Optional(String),
				sidebarViewMode: Match.Optional(String),
				sidebarHideAvatar: Match.Optional(Boolean),
				sidebarGroupByType: Match.Optional(Boolean),
				sidebarShowDiscussion: Match.Optional(Boolean),
				sidebarShowServiceAccounts: Match.Optional(Boolean),
				muteFocusedConversations: Match.Optional(Boolean),
			}),
		});
		const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
		const userData = {
			_id: userId,
			settings: {
				preferences: this.bodyParams.data,
			},
		};

		if (this.bodyParams.data.language) {
			const { language } = this.bodyParams.data;
			delete this.bodyParams.data.language;
			userData.language = language;
		}

		Meteor.runAsUser(this.userId, () => saveUser(this.userId, userData));
		const user = Users.findOneById(userId, {
			fields: {
				'settings.preferences': 1,
				language: 1,
			},
		});

		return API.v1.success({
			user: {
				_id: user._id,
				settings: {
					preferences: {
						...user.settings.preferences,
						language: user.language,
					},
				},
			},
		});
	},
});

API.v1.addRoute('users.forgotPassword', { authRequired: false }, {
	post() {
		const { email } = this.bodyParams;
		if (!email) {
			return API.v1.failure('The \'email\' param is required');
		}

		const emailSent = Meteor.call('sendForgotPasswordEmail', email);
		if (emailSent) {
			return API.v1.success();
		}
		return API.v1.failure('User not found');
	},
});

API.v1.addRoute('users.getUsernameSuggestion', { authRequired: true }, {
	get() {
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUsernameSuggestion'));

		return API.v1.success({ result });
	},
});

API.v1.addRoute('users.generatePersonalAccessToken', { authRequired: true }, {
	post() {
		const { tokenName } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:generateToken', { tokenName }));

		return API.v1.success({ token });
	},
});

API.v1.addRoute('users.regeneratePersonalAccessToken', { authRequired: true }, {
	post() {
		const { tokenName } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:regenerateToken', { tokenName }));

		return API.v1.success({ token });
	},
});

API.v1.addRoute('users.getPersonalAccessTokens', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized');
		}
		const loginTokens = Users.getLoginTokensByUserId(this.userId).fetch()[0];
		const getPersonalAccessTokens = () => loginTokens.services.resume.loginTokens
			.filter((loginToken) => loginToken.type && loginToken.type === 'personalAccessToken')
			.map((loginToken) => ({
				name: loginToken.name,
				createdAt: loginToken.createdAt,
				lastTokenPart: loginToken.lastTokenPart,
			}));

		return API.v1.success({
			tokens: loginTokens ? getPersonalAccessTokens() : [],
		});
	},
});

API.v1.addRoute('users.removePersonalAccessToken', { authRequired: true }, {
	post() {
		const { tokenName } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:removeToken', {
			tokenName,
		}));

		return API.v1.success();
	},
});

API.v1.addRoute('users.presence', { authRequired: true }, {
	get() {
		const { from } = this.queryParams;

		const options = {
			fields: {
				username: 1,
				name: 1,
				status: 1,
				utcOffset: 1,
				statusText: 1,
			},
		};

		if (from) {
			const ts = new Date(from);
			const diff = (Date.now() - ts) / 1000 / 60;

			if (diff < 10) {
				return API.v1.success({
					users: Users.findNotIdUpdatedFrom(this.userId, ts, options).fetch(),
					full: false,
				});
			}
		}

		return API.v1.success({
			users: Users.findUsersNotOffline(options).fetch(),
			full: true,
		});
	},
});
