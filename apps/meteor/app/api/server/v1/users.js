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
import { saveUser, setUserAvatar, saveCustomFields, checkUsernameAvailability } from '../../../lib/server';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';

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

// -------------------------------------------------------------

// -------------------------------------------------------------
// TO-DO

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

// -------------------------------------------------------------

settings.watch('Rate_Limiter_Limit_RegisterUser', (value) => {
	const userRegisterRoute = '/api/v1/users.registerpost';

	API.v1.updateRateLimiterDictionaryForRoute(userRegisterRoute, value);
});
