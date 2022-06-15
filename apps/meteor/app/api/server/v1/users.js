import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';

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

			const [image, fields] = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'image' },
			);

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

settings.watch('Rate_Limiter_Limit_RegisterUser', (value) => {
	const userRegisterRoute = '/api/v1/users.registerpost';

	API.v1.updateRateLimiterDictionaryForRoute(userRegisterRoute, value);
});
