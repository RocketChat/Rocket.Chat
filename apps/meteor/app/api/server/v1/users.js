import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';
import {
	isUsersSetAvatarProps,
	isUsersUpdateParamsPOST,
	isUsersUpdateOwnBasicInfoParamsPOST,
	isUsersSetPreferencesParamsPOST,
} from '@rocket.chat/rest-typings';

import { Users } from '../../../models/server';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings/server';
import { saveUser, setUserAvatar, saveCustomFields } from '../../../lib/server';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';
import { getURL } from '../../../utils/server';

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

// -------------------------------------------------------------
// TO-DO
API.v1.addRoute(
	'users.setAvatar',
	{ authRequired: true, validateParams: isUsersSetAvatarProps },
	{
		async post() {
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
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// TO-DO
API.v1.addRoute(
	'users.update',
	{ authRequired: true, twoFactorRequired: true, validateParams: isUsersUpdateParamsPOST },
	{
		post() {
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
// -------------------------------------------------------------

// -------------------------------------------------------------
// TO-DO
API.v1.addRoute(
	'users.updateOwnBasicInfo',
	{ authRequired: true, validateParams: isUsersUpdateOwnBasicInfoParamsPOST },
	{
		post() {
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
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// TO-DO
API.v1.addRoute(
	'users.setPreferences',
	{ authRequired: true, validateParams: isUsersSetPreferencesParamsPOST },
	{
		post() {
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
// -------------------------------------------------------------

settings.watch('Rate_Limiter_Limit_RegisterUser', (value) => {
	const userRegisterRoute = '/api/v1/users.registerpost';

	API.v1.updateRateLimiterDictionaryForRoute(userRegisterRoute, value);
});
