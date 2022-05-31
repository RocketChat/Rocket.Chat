import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { Users, Subscriptions } from '../../../models/server';
import { Users as UsersRaw } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings/server';
import { getURL } from '../../../utils';
import {
	validateCustomFields,
	saveUser,
	saveCustomFieldsWithoutValidation,
	checkUsernameAvailability,
	setUserAvatar,
	saveCustomFields,
	setStatusText,
} from '../../../lib/server';
import { getFullUserDataByIdOrUsername } from '../../../lib/server/functions/getFullUserData';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';
import { findUsersToAutocomplete, getInclusiveFields, getNonEmptyFields, getNonEmptyQuery } from '../lib/users';
import { getUserForCheck, emailCheck } from '../../../2fa/server/code';
import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';
import { setUserStatus } from '../../../../imports/users-presence/server/activeUsers';
import { resetTOTP } from '../../../2fa/server/functions/resetTOTP';
import { Team } from '../../../../server/sdk';
import { isValidQuery } from '../lib/isValidQuery';

API.v1.addRoute(
	'users.create',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				email: String,
				name: String,
				password: String,
				username: String,
				active: Match.Maybe(Boolean),
				bio: Match.Maybe(String),
				nickname: Match.Maybe(String),
				statusText: Match.Maybe(String),
				roles: Match.Maybe(Array),
				joinDefaultChannels: Match.Maybe(Boolean),
				requirePasswordChange: Match.Maybe(Boolean),
				setRandomPassword: Match.Maybe(Boolean),
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

			const { fields } = this.parseJsonQuery();

			return API.v1.success({ user: Users.findOneById(newUserId, { fields }) });
		},
	},
);

API.v1.addRoute(
	'users.delete',
	{ authRequired: true },
	{
		post() {
			if (!hasPermission(this.userId, 'delete-user')) {
				return API.v1.unauthorized();
			}

			const user = this.getUserFromParams();
			const { confirmRelinquish = false } = this.requestParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('deleteUser', user._id, confirmRelinquish);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.deleteOwnAccount',
	{ authRequired: true },
	{
		post() {
			const { password } = this.bodyParams;
			if (!password) {
				return API.v1.failure('Body parameter "password" is required.');
			}
			if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const { confirmRelinquish = false } = this.requestParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('deleteUserOwnAccount', password, confirmRelinquish);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.getAvatar',
	{ authRequired: false },
	{
		get() {
			const user = this.getUserFromParams();

			const url = getURL(`/avatar/${user.username}`, { cdn: false, full: true });
			this.response.setHeader('Location', url);

			return {
				statusCode: 307,
				body: url,
			};
		},
	},
);

API.v1.addRoute(
	'users.setActiveStatus',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				userId: String,
				activeStatus: Boolean,
				confirmRelinquish: Match.Maybe(Boolean),
			});

			if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
				return API.v1.unauthorized();
			}

			Meteor.runAsUser(this.userId, () => {
				const { userId, activeStatus, confirmRelinquish = false } = this.bodyParams;
				Meteor.call('setUserActiveStatus', userId, activeStatus, confirmRelinquish);
			});
			return API.v1.success({
				user: Users.findOneById(this.bodyParams.userId, { fields: { active: 1 } }),
			});
		},
	},
);

API.v1.addRoute(
	'users.deactivateIdle',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				daysIdle: Match.Integer,
				role: Match.Optional(String),
			});

			if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
				return API.v1.unauthorized();
			}

			const { daysIdle, role = 'user' } = this.bodyParams;

			const lastLoggedIn = new Date();
			lastLoggedIn.setDate(lastLoggedIn.getDate() - daysIdle);

			const count = Users.setActiveNotLoggedInAfterWithRole(lastLoggedIn, role, false);

			return API.v1.success({
				count,
			});
		},
	},
);

API.v1.addRoute(
	'users.getPresence',
	{ authRequired: true },
	{
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
	},
);

API.v1.addRoute(
	'users.info',
	{ authRequired: true },
	{
		get() {
			const { username, userId } = this.requestParams();
			const { fields } = this.parseJsonQuery();

			check(userId, Match.Maybe(String));
			check(username, Match.Maybe(String));

			if (userId !== undefined && username !== undefined) {
				throw new Meteor.Error('invalid-filter', 'Cannot filter by id and username at once');
			}

			if (!userId && !username) {
				throw new Meteor.Error('invalid-filter', 'Must filter by id or username');
			}

			const user = getFullUserDataByIdOrUsername({ userId: this.userId, filterId: userId, filterUsername: username });

			if (!user) {
				return API.v1.failure('User not found.');
			}
			const myself = user._id === this.userId;
			if (fields.userRooms === 1 && (myself || hasPermission(this.userId, 'view-other-user-channels'))) {
				user.rooms = Subscriptions.findByUserId(user._id, {
					fields: {
						rid: 1,
						name: 1,
						t: 1,
						roles: 1,
						unread: 1,
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
	},
);

API.v1.addRoute(
	'users.list',
	{
		authRequired: true,
		queryOperations: ['$or', '$and'],
	},
	{
		get() {
			if (!hasPermission(this.userId, 'view-d-room')) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const nonEmptyQuery = getNonEmptyQuery(query);
			const nonEmptyFields = getNonEmptyFields(fields);

			const inclusiveFields = getInclusiveFields(nonEmptyFields);

			const inclusiveFieldsKeys = Object.keys(inclusiveFields);

			if (
				!isValidQuery(
					nonEmptyQuery,
					[
						...inclusiveFieldsKeys,
						inclusiveFieldsKeys.includes('emails') && 'emails.address.*',
						inclusiveFieldsKeys.includes('username') && 'username.*',
						inclusiveFieldsKeys.includes('name') && 'name.*',
					].filter(Boolean),
					this.queryOperations,
				)
			) {
				throw new Meteor.Error('error-invalid-query', isValidQuery.errors.join('\n'));
			}

			const actualSort = sort && sort.name ? { nameInsensitive: sort.name, ...sort } : sort || { username: 1 };

			const limit =
				count !== 0
					? [
							{
								$limit: count,
							},
					  ]
					: [];

			const result = Promise.await(
				UsersRaw.col
					.aggregate([
						{
							$match: nonEmptyQuery,
						},
						{
							$project: inclusiveFields,
						},
						{
							$addFields: {
								nameInsensitive: {
									$toLower: '$name',
								},
							},
						},
						{
							$facet: {
								sortedResults: [
									{
										$sort: actualSort,
									},
									{
										$skip: offset,
									},
									...limit,
								],
								totalCount: [{ $group: { _id: null, total: { $sum: 1 } } }],
							},
						},
					])
					.toArray(),
			);

			const {
				sortedResults: users,
				totalCount: [{ total } = { total: 0 }],
			} = result[0];

			return API.v1.success({
				users,
				count: users.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'users.register',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: settings.get('Rate_Limiter_Limit_RegisterUser'),
			intervalTimeInMS: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		},
	},
	{
		post() {
			if (this.userId) {
				return API.v1.failure('Logged in users can not register again.');
			}

			// We set their username here, so require it
			// The `registerUser` checks for the other requirements
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					username: String,
				}),
			);

			if (!checkUsernameAvailability(this.bodyParams.username)) {
				return API.v1.failure('Username is already in use');
			}

			// Register the user
			const userId = Meteor.call('registerUser', this.bodyParams);

			// Now set their username
			Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
			const { fields } = this.parseJsonQuery();

			return API.v1.success({ user: Users.findOneById(userId, { fields }) });
		},
	},
);

API.v1.addRoute(
	'users.resetAvatar',
	{ authRequired: true },
	{
		post() {
			const user = this.getUserFromParams();

			if (settings.get('Accounts_AllowUserAvatarChange') && user._id === this.userId) {
				Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
			} else if (hasPermission(this.userId, 'edit-other-user-avatar')) {
				Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar', user._id));
			} else {
				throw new Meteor.Error('error-not-allowed', 'Reset avatar is not allowed', {
					method: 'users.resetAvatar',
				});
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.setAvatar',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					avatarUrl: Match.Maybe(String),
					userId: Match.Maybe(String),
					username: Match.Maybe(String),
				}),
			);
			const canEditOtherUserAvatar = hasPermission(this.userId, 'edit-other-user-avatar');

			if (!settings.get('Accounts_AllowUserAvatarChange') && !canEditOtherUserAvatar) {
				throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
					method: 'users.setAvatar',
				});
			}

			let user;
			if (this.isUserFromParams()) {
				user = Meteor.users.findOne(this.userId);
			} else if (canEditOtherUserAvatar) {
				user = this.getUserFromParams();
			} else {
				return API.v1.unauthorized();
			}

			if (this.bodyParams.avatarUrl) {
				setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
				return API.v1.success();
			}

			const { image, ...fields } = await getUploadFormData({
				request: this.request,
			});

			if (!image) {
				return API.v1.failure("The 'image' param is required");
			}

			const sentTheUserByFormData = fields.userId || fields.username;
			if (sentTheUserByFormData) {
				if (fields.userId) {
					user = Users.findOneById(fields.userId, { fields: { username: 1 } });
				} else if (fields.username) {
					user = Users.findOneByUsernameIgnoringCase(fields.username, { fields: { username: 1 } });
				}

				if (!user) {
					throw new Meteor.Error('error-invalid-user', 'The optional "userId" or "username" param provided does not match any users');
				}

				const isAnotherUser = this.userId !== user._id;
				if (isAnotherUser && !hasPermission(this.userId, 'edit-other-user-avatar')) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}
			}

			setUserAvatar(user, image.fileBuffer, image.mimetype, 'rest');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.getStatus',
	{ authRequired: true },
	{
		get() {
			if (this.isUserFromParams()) {
				const user = Users.findOneById(this.userId);
				return API.v1.success({
					_id: user._id,
					message: user.statusText,
					connectionStatus: user.statusConnection,
					status: user.status,
				});
			}

			const user = this.getUserFromParams();

			return API.v1.success({
				_id: user._id,
				message: user.statusText,
				status: user.status,
			});
		},
	},
);

API.v1.addRoute(
	'users.setStatus',
	{ authRequired: true },
	{
		post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					status: Match.Maybe(String),
					message: Match.Maybe(String),
				}),
			);

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
				if (this.bodyParams.message || this.bodyParams.message === '') {
					setStatusText(user._id, this.bodyParams.message);
				}
				if (this.bodyParams.status) {
					const validStatus = ['online', 'away', 'offline', 'busy'];
					if (validStatus.includes(this.bodyParams.status)) {
						const { status } = this.bodyParams;

						if (status === 'offline' && !settings.get('Accounts_AllowInvisibleStatusOption')) {
							throw new Meteor.Error('error-status-not-allowed', 'Invisible status is disabled', {
								method: 'users.setStatus',
							});
						}

						Meteor.users.update(user._id, {
							$set: {
								status,
								statusDefault: status,
							},
						});

						setUserStatus(user, status);
					} else {
						throw new Meteor.Error('error-invalid-status', 'Valid status types include online, away, offline, and busy.', {
							method: 'users.setStatus',
						});
					}
				}
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.update',
	{ authRequired: true, twoFactorRequired: true },
	{
		post() {
			check(this.bodyParams, {
				userId: String,
				data: Match.ObjectIncluding({
					email: Match.Maybe(String),
					name: Match.Maybe(String),
					password: Match.Maybe(String),
					username: Match.Maybe(String),
					bio: Match.Maybe(String),
					nickname: Match.Maybe(String),
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
				const {
					userId,
					data: { active },
					confirmRelinquish = false,
				} = this.bodyParams;

				Meteor.runAsUser(this.userId, () => {
					Meteor.call('setUserActiveStatus', userId, active, confirmRelinquish);
				});
			}
			const { fields } = this.parseJsonQuery();

			return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields }) });
		},
	},
);

API.v1.addRoute(
	'users.updateOwnBasicInfo',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				data: Match.ObjectIncluding({
					email: Match.Maybe(String),
					name: Match.Maybe(String),
					username: Match.Maybe(String),
					nickname: Match.Maybe(String),
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
				nickname: this.bodyParams.data.nickname,
				statusText: this.bodyParams.data.statusText,
				newPassword: this.bodyParams.data.newPassword,
				typedPassword: this.bodyParams.data.currentPassword,
			};

			// saveUserProfile now uses the default two factor authentication procedures, so we need to provide that
			const twoFactorOptions = !userData.typedPassword
				? null
				: {
						twoFactorCode: userData.typedPassword,
						twoFactorMethod: 'password',
				  };

			Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields, twoFactorOptions));

			return API.v1.success({
				user: Users.findOneById(this.userId, { fields: API.v1.defaultFieldsToExclude }),
			});
		},
	},
);

API.v1.addRoute(
	'users.createToken',
	{ authRequired: true },
	{
		post() {
			const user = this.getUserFromParams();
			let data;
			Meteor.runAsUser(this.userId, () => {
				data = Meteor.call('createToken', user._id);
			});
			return data ? API.v1.success({ data }) : API.v1.unauthorized();
		},
	},
);

API.v1.addRoute(
	'users.getPreferences',
	{ authRequired: true },
	{
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
	},
);

API.v1.addRoute(
	'users.setPreferences',
	{ authRequired: true },
	{
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
					pushNotifications: Match.Maybe(String),
					enableAutoAway: Match.Maybe(Boolean),
					highlights: Match.Maybe(Array),
					desktopNotificationRequireInteraction: Match.Maybe(Boolean),
					messageViewMode: Match.Maybe(Number),
					showMessageInMainThread: Match.Maybe(Boolean),
					hideUsernames: Match.Maybe(Boolean),
					hideRoles: Match.Maybe(Boolean),
					displayAvatars: Match.Maybe(Boolean),
					hideFlexTab: Match.Maybe(Boolean),
					sendOnEnter: Match.Maybe(String),
					language: Match.Maybe(String),
					sidebarShowFavorites: Match.Optional(Boolean),
					sidebarShowUnread: Match.Optional(Boolean),
					sidebarSortby: Match.Optional(String),
					sidebarViewMode: Match.Optional(String),
					sidebarDisplayAvatar: Match.Optional(Boolean),
					sidebarGroupByType: Match.Optional(Boolean),
					muteFocusedConversations: Match.Optional(Boolean),
				}),
			});
			if (this.bodyParams.userId && this.bodyParams.userId !== this.userId && !hasPermission(this.userId, 'edit-other-user-info')) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed');
			}
			const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
			if (!Users.findOneById(userId)) {
				throw new Meteor.Error('error-invalid-user', 'The optional "userId" param provided does not match any users');
			}

			Meteor.runAsUser(userId, () => Meteor.call('saveUserPreferences', this.bodyParams.data));
			const user = Users.findOneById(userId, {
				fields: {
					'settings.preferences': 1,
					'language': 1,
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
	},
);

API.v1.addRoute(
	'users.forgotPassword',
	{ authRequired: false },
	{
		post() {
			const { email } = this.bodyParams;
			if (!email) {
				return API.v1.failure("The 'email' param is required");
			}

			Meteor.call('sendForgotPasswordEmail', email);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.getUsernameSuggestion',
	{ authRequired: true },
	{
		get() {
			const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUsernameSuggestion'));

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'users.generatePersonalAccessToken',
	{ authRequired: true, twoFactorRequired: true },
	{
		post() {
			const { tokenName, bypassTwoFactor } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:generateToken', { tokenName, bypassTwoFactor }));

			return API.v1.success({ token });
		},
	},
);

API.v1.addRoute(
	'users.regeneratePersonalAccessToken',
	{ authRequired: true, twoFactorRequired: true },
	{
		post() {
			const { tokenName } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:regenerateToken', { tokenName }));

			return API.v1.success({ token });
		},
	},
);

API.v1.addRoute(
	'users.getPersonalAccessTokens',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'create-personal-access-tokens')) {
				throw new Meteor.Error('not-authorized', 'Not Authorized');
			}
			const loginTokens = Users.getLoginTokensByUserId(this.userId).fetch()[0];
			const getPersonalAccessTokens = () =>
				loginTokens.services.resume.loginTokens
					.filter((loginToken) => loginToken.type && loginToken.type === 'personalAccessToken')
					.map((loginToken) => ({
						name: loginToken.name,
						createdAt: loginToken.createdAt,
						lastTokenPart: loginToken.lastTokenPart,
						bypassTwoFactor: loginToken.bypassTwoFactor,
					}));

			return API.v1.success({
				tokens: loginTokens ? getPersonalAccessTokens() : [],
			});
		},
	},
);

API.v1.addRoute(
	'users.removePersonalAccessToken',
	{ authRequired: true, twoFactorRequired: true },
	{
		post() {
			const { tokenName } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			Meteor.runAsUser(this.userId, () =>
				Meteor.call('personalAccessTokens:removeToken', {
					tokenName,
				}),
			);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.2fa.enableEmail',
	{ authRequired: true },
	{
		post() {
			Users.enableEmail2FAByUserId(this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.2fa.disableEmail',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		post() {
			Users.disableEmail2FAByUserId(this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute('users.2fa.sendEmailCode', {
	post() {
		const { emailOrUsername } = this.bodyParams;

		if (!emailOrUsername) {
			throw new Meteor.Error('error-parameter-required', 'emailOrUsername is required');
		}

		const method = emailOrUsername.includes('@') ? 'findOneByEmailAddress' : 'findOneByUsername';
		const userId = this.userId || Users[method](emailOrUsername, { fields: { _id: 1 } })?._id;

		if (!userId) {
			this.logger.error('[2fa] User was not found when requesting 2fa email code');
			return API.v1.success();
		}

		emailCheck.sendEmailCode(getUserForCheck(userId));

		return API.v1.success();
	},
});

API.v1.addRoute(
	'users.presence',
	{ authRequired: true },
	{
		get() {
			const { from, ids } = this.queryParams;

			const options = {
				fields: {
					username: 1,
					name: 1,
					status: 1,
					utcOffset: 1,
					statusText: 1,
					avatarETag: 1,
				},
			};

			if (ids) {
				return API.v1.success({
					users: Users.findNotOfflineByIds(Array.isArray(ids) ? ids : ids.split(','), options).fetch(),
					full: false,
				});
			}

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
	},
);

API.v1.addRoute(
	'users.requestDataDownload',
	{ authRequired: true },
	{
		get() {
			const { fullExport = false } = this.queryParams;
			const result = Meteor.runAsUser(this.userId, () => Meteor.call('requestDataDownload', { fullExport: fullExport === 'true' }));

			return API.v1.success({
				requested: result.requested,
				exportOperation: result.exportOperation,
			});
		},
	},
);

API.v1.addRoute(
	'users.logoutOtherClients',
	{ authRequired: true },
	{
		async post() {
			try {
				const hashedToken = Accounts._hashLoginToken(this.request.headers['x-auth-token']);

				if (!(await UsersRaw.removeNonPATLoginTokensExcept(this.userId, hashedToken))) {
					throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
				}

				const me = await UsersRaw.findOneById(this.userId, { projection: { 'services.resume.loginTokens': 1 } });

				const token = me.services.resume.loginTokens.find((token) => token.hashedToken === hashedToken);

				const tokenExpires = new Date(token.when.getTime() + settings.get('Accounts_LoginExpiration') * 1000);

				return API.v1.success({
					token: this.request.headers['x-auth-token'],
					tokenExpires,
				});
			} catch (error) {
				return API.v1.failure(error);
			}
		},
	},
);

API.v1.addRoute(
	'users.autocomplete',
	{ authRequired: true },
	{
		get() {
			const { selector } = this.queryParams;

			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				Promise.await(
					findUsersToAutocomplete({
						uid: this.userId,
						selector: JSON.parse(selector),
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'users.removeOtherTokens',
	{ authRequired: true },
	{
		post() {
			API.v1.success(Meteor.call('removeOtherTokens'));
		},
	},
);

API.v1.addRoute(
	'users.resetE2EKey',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		post() {
			// reset own keys
			if (this.isUserFromParams()) {
				resetUserE2EEncriptionKey(this.userId, false);
				return API.v1.success();
			}

			// reset other user keys
			const user = this.getUserFromParams();
			if (!user) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			if (!hasPermission(Meteor.userId(), 'edit-other-user-e2ee')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			if (!resetUserE2EEncriptionKey(user._id, true)) {
				return API.v1.failure();
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.resetTOTP',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		post() {
			// reset own keys
			if (this.isUserFromParams()) {
				Promise.await(resetTOTP(this.userId, false));
				return API.v1.success();
			}

			// reset other user keys
			const user = this.getUserFromParams();
			if (!user) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			if (!hasPermission(Meteor.userId(), 'edit-other-user-totp')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			Promise.await(resetTOTP(user._id, true));

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.listTeams',
	{ authRequired: true },
	{
		get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					userId: Match.Maybe(String),
				}),
			);
			const { userId } = this.queryParams;

			if (!userId) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			// If the caller has permission to view all teams, there's no need to filter the teams
			const adminId = hasPermission(this.userId, 'view-all-teams') ? undefined : this.userId;

			const teams = Promise.await(Team.findBySubscribedUserIds(userId, adminId));

			return API.v1.success({
				teams,
			});
		},
	},
);

API.v1.addRoute(
	'users.logout',
	{ authRequired: true },
	{
		post() {
			const userId = this.bodyParams.userId || this.userId;

			if (userId !== this.userId && !hasPermission(this.userId, 'logout-other-user')) {
				return API.v1.unauthorized();
			}

			// this method logs the user out automatically, if successful returns 1, otherwise 0
			if (!Users.unsetLoginTokens(userId)) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			return API.v1.success({
				message: `User ${userId} has been logged out!`,
			});
		},
	},
);

settings.watch('Rate_Limiter_Limit_RegisterUser', (value) => {
	const userRegisterRoute = '/api/v1/users.registerpost';

	API.v1.updateRateLimiterDictionaryForRoute(userRegisterRoute, value);
});
