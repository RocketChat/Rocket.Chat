import {
	isUserCreateParamsPOST,
	isUserSetActiveStatusParamsPOST,
	isUserDeactivateIdleParamsPOST,
	isUsersInfoParamsGetProps,
	isUserRegisterParamsPOST,
	isUserLogoutParamsPOST,
	isUsersListTeamsProps,
	isUsersAutocompleteProps,
	isUsersSetAvatarProps,
	isUsersUpdateParamsPOST,
	isUsersUpdateOwnBasicInfoParamsPOST,
	isUsersSetPreferencesParamsPOST,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IExportOperation, IPersonalAccessToken, IUser } from '@rocket.chat/core-typings';
import { Users as UsersRaw } from '@rocket.chat/models';

import { Users, Subscriptions } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import {
	validateCustomFields,
	saveUser,
	saveCustomFieldsWithoutValidation,
	checkUsernameAvailability,
	setStatusText,
	setUserAvatar,
	saveCustomFields,
} from '../../../lib/server';
import { getFullUserDataByIdOrUsername } from '../../../lib/server/functions/getFullUserData';
import { API } from '../api';
import { findUsersToAutocomplete, getInclusiveFields, getNonEmptyFields, getNonEmptyQuery } from '../lib/users';
import { getUserForCheck, emailCheck } from '../../../2fa/server/code';
import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';
import { resetTOTP } from '../../../2fa/server/functions/resetTOTP';
import { Team } from '../../../../server/sdk';
import { isValidQuery } from '../lib/isValidQuery';
import { setUserStatus } from '../../../../imports/users-presence/server/activeUsers';
import { getURL } from '../../../utils/server';
import { getUploadFormData } from '../lib/getUploadFormData';

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
	'users.update',
	{ authRequired: true, twoFactorRequired: true, validateParams: isUsersUpdateParamsPOST },
	{
		post() {
			const userData = { _id: this.bodyParams.userId, ...this.bodyParams.data };

			Meteor.runAsUser(this.userId, () => saveUser(this.userId, userData));

			if (this.bodyParams.data.customFields) {
				saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
			}

			if (typeof this.bodyParams.data.active !== 'undefined') {
				const {
					userId,
					data: { active },
					confirmRelinquish,
				} = this.bodyParams;

				Meteor.call('setUserActiveStatus', userId, active, Boolean(confirmRelinquish));
			}
			const { fields } = this.parseJsonQuery();

			return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields }) });
		},
	},
);

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

			Meteor.call('saveUserProfile', userData, this.bodyParams.customFields, twoFactorOptions);

			return API.v1.success({
				user: Users.findOneById(this.userId, { fields: API.v1.defaultFieldsToExclude }),
			});
		},
	},
);

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

			let user = ((): IUser | undefined => {
				if (this.isUserFromParams()) {
					return Meteor.users.findOne(this.userId) as IUser | undefined;
				}
				if (canEditOtherUserAvatar) {
					return this.getUserFromParams();
				}
			})();

			if (!user) {
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
				{
					field: 'image',
				},
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
	'users.create',
	{ authRequired: true, validateParams: isUserCreateParamsPOST },
	{
		post() {
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
				Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
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

			Meteor.call('deleteUser', user._id, confirmRelinquish);

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

			Meteor.call('deleteUserOwnAccount', password, confirmRelinquish);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.setActiveStatus',
	{ authRequired: true, validateParams: isUserSetActiveStatusParamsPOST },
	{
		post() {
			if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
				return API.v1.unauthorized();
			}

			const { userId, activeStatus, confirmRelinquish = false } = this.bodyParams;
			Meteor.call('setUserActiveStatus', userId, activeStatus, confirmRelinquish);
			return API.v1.success({
				user: Users.findOneById(this.bodyParams.userId, { fields: { active: 1 } }),
			});
		},
	},
);

API.v1.addRoute(
	'users.deactivateIdle',
	{ authRequired: true, validateParams: isUserDeactivateIdleParamsPOST },
	{
		post() {
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
	'users.info',
	{ authRequired: true, validateParams: isUsersInfoParamsGetProps },
	{
		async get() {
			const { fields } = this.parseJsonQuery();

			const user = await getFullUserDataByIdOrUsername(this.userId, {
				filterId: (this.queryParams as any).userId,
				filterUsername: (this.queryParams as any).username,
			});

			if (!user) {
				return API.v1.failure('User not found.');
			}
			const myself = user._id === this.userId;
			if (fields.userRooms === 1 && (myself || hasPermission(this.userId, 'view-other-user-channels'))) {
				return API.v1.success({
					user: {
						...user,
						rooms: Subscriptions.findByUserId(user._id, {
							projection: {
								rid: 1,
								name: 1,
								t: 1,
								roles: 1,
								unread: 1,
								federated: 1,
							},
							sort: {
								t: 1,
								name: 1,
							},
						}).fetch(),
					},
				});
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
		async get() {
			if (!hasPermission(this.userId, 'view-d-room')) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const nonEmptyQuery = getNonEmptyQuery(query, hasPermission(this.userId, 'view-full-other-user-info'));
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
						inclusiveFieldsKeys.includes('type') && 'type.*',
					].filter(Boolean) as string[],
					this.queryOperations,
				)
			) {
				throw new Meteor.Error('error-invalid-query', isValidQuery.errors.join('\n'));
			}

			const actualSort = sort?.name ? { nameInsensitive: sort.name, ...sort } : sort || { username: 1 };

			const limit =
				count !== 0
					? [
							{
								$limit: count,
							},
					  ]
					: [];

			const result = await UsersRaw.col
				.aggregate<{ sortedResults: IUser[]; totalCount: { total: number }[] }>([
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
				.toArray();

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
			numRequestsAllowed: settings.get('Rate_Limiter_Limit_RegisterUser') ?? 1,
			intervalTimeInMS: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		},
		validateParams: isUserRegisterParamsPOST,
	},
	{
		post() {
			if (this.userId) {
				return API.v1.failure('Logged in users can not register again.');
			}

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
	'users.createToken',
	{ authRequired: true },
	{
		post() {
			const user = this.getUserFromParams();
			const data = Meteor.call('createToken', user._id);
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
			const result = Meteor.call('getUsernameSuggestion');

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
			const token = Meteor.call('personalAccessTokens:generateToken', { tokenName, bypassTwoFactor });

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
			const token = Meteor.call('personalAccessTokens:regenerateToken', { tokenName });

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

			const user = Users.getLoginTokensByUserId(this.userId).fetch()[0] as IUser | undefined;

			return API.v1.success({
				tokens:
					user?.services?.resume?.loginTokens
						?.filter((loginToken: any) => loginToken.type === 'personalAccessToken')
						.map((loginToken: IPersonalAccessToken) => ({
							name: loginToken.name,
							createdAt: loginToken.createdAt.toISOString(),
							lastTokenPart: loginToken.lastTokenPart,
							bypassTwoFactor: Boolean(loginToken.bypassTwoFactor),
						})) || [],
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
			Meteor.call('personalAccessTokens:removeToken', {
				tokenName,
			});

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
			// this.logger.error('[2fa] User was not found when requesting 2fa email code');
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
				const diff = (Date.now() - Number(ts)) / 1000 / 60;

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
			const result = Meteor.call('requestDataDownload', { fullExport: fullExport === 'true' }) as {
				requested: boolean;
				exportOperation: IExportOperation;
			};

			return API.v1.success({
				requested: Boolean(result.requested),
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
			const xAuthToken = this.request.headers['x-auth-token'] as string;

			if (!xAuthToken) {
				throw new Meteor.Error('error-parameter-required', 'x-auth-token is required');
			}
			const hashedToken = Accounts._hashLoginToken(xAuthToken);

			if (!(await UsersRaw.removeNonPATLoginTokensExcept(this.userId, hashedToken))) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			const me = (await UsersRaw.findOneById(this.userId, { projection: { 'services.resume.loginTokens': 1 } })) as Pick<IUser, 'services'>;

			const token = me.services?.resume?.loginTokens?.find((token) => token.hashedToken === hashedToken);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const tokenExpires = new Date(token!.when.getTime() + settings.get<number>('Accounts_LoginExpiration') * 1000);

			return API.v1.success({
				token: xAuthToken,
				tokenExpires: tokenExpires.toISOString() || '',
			});
		},
	},
);

API.v1.addRoute(
	'users.autocomplete',
	{ authRequired: true, validateParams: isUsersAutocompleteProps },
	{
		async get() {
			const { selector } = this.queryParams;
			return API.v1.success(
				await findUsersToAutocomplete({
					uid: this.userId,
					selector: JSON.parse(selector),
				}),
			);
		},
	},
);

API.v1.addRoute(
	'users.removeOtherTokens',
	{ authRequired: true },
	{
		post() {
			return API.v1.success(Meteor.call('removeOtherTokens'));
		},
	},
);

API.v1.addRoute(
	'users.resetE2EKey',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		post() {
			if ('userId' in this.bodyParams || 'username' in this.bodyParams || 'user' in this.bodyParams) {
				// reset other user keys
				const user = this.getUserFromParams();
				if (!user) {
					throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
				}

				if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				if (!hasPermission(this.userId, 'edit-other-user-e2ee')) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				if (!resetUserE2EEncriptionKey(user._id, true)) {
					return API.v1.failure();
				}

				return API.v1.success();
			}
			resetUserE2EEncriptionKey(this.userId, false);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.resetTOTP',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		async post() {
			// // reset own keys
			if ('userId' in this.bodyParams || 'username' in this.bodyParams || 'user' in this.bodyParams) {
				// reset other user keys
				if (!hasPermission(this.userId, 'edit-other-user-totp')) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				const user = this.getUserFromParams();
				if (!user) {
					throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
				}

				await resetTOTP(user._id, true);

				return API.v1.success();
			}
			await resetTOTP(this.userId, false);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.listTeams',
	{ authRequired: true, validateParams: isUsersListTeamsProps },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					userId: Match.Maybe(String),
				}),
			);

			const { userId } = this.queryParams;

			// If the caller has permission to view all teams, there's no need to filter the teams
			const adminId = hasPermission(this.userId, 'view-all-teams') ? undefined : this.userId;

			const teams = await Team.findBySubscribedUserIds(userId, adminId);

			return API.v1.success({
				teams,
			});
		},
	},
);

API.v1.addRoute(
	'users.logout',
	{ authRequired: true, validateParams: isUserLogoutParamsPOST },
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

API.v1.addRoute(
	'users.getPresence',
	{ authRequired: true },
	{
		get() {
			if (this.isUserFromParams()) {
				const user = Users.findOneById(this.userId);
				return API.v1.success({
					presence: user.status || 'offline',
					connectionStatus: user.statusConnection || 'offline',
					...(user.lastLogin && { lastLogin: user.lastLogin }),
				});
			}

			const user = this.getUserFromParams();

			return API.v1.success({
				presence: user.status || 'offline',
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
				Match.OneOf(
					Match.ObjectIncluding({
						status: Match.Maybe(String),
						message: String,
					}),
					Match.ObjectIncluding({
						status: String,
						message: Match.Maybe(String),
					}),
				),
			);

			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				throw new Meteor.Error('error-not-allowed', 'Change status is not allowed', {
					method: 'users.setStatus',
				});
			}

			const user = ((): IUser | undefined => {
				if (this.isUserFromParams()) {
					return Meteor.users.findOne(this.userId) as IUser;
				}
				if (hasPermission(this.userId, 'edit-other-user-info')) {
					return this.getUserFromParams();
				}
			})();

			if (user === undefined) {
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

// status: 'online' | 'offline' | 'away' | 'busy';
// message?: string;
// _id: string;
// connectionStatus?: 'online' | 'offline' | 'away' | 'busy';
// };

API.v1.addRoute(
	'users.getStatus',
	{ authRequired: true },
	{
		get() {
			if (this.isUserFromParams()) {
				const user = Users.findOneById(this.userId);
				return API.v1.success({
					_id: user._id,
					// message: user.statusText,
					connectionStatus: (user.statusConnection || 'offline') as 'online' | 'offline' | 'away' | 'busy',
					status: (user.status || 'offline') as 'online' | 'offline' | 'away' | 'busy',
				});
			}

			const user = this.getUserFromParams();

			return API.v1.success({
				_id: user._id,
				// message: user.statusText,
				status: (user.status || 'offline') as 'online' | 'offline' | 'away' | 'busy',
			});
		},
	},
);

settings.watch<number>('Rate_Limiter_Limit_RegisterUser', (value) => {
	const userRegisterRoute = '/api/v1/users.registerpost';

	API.v1.updateRateLimiterDictionaryForRoute(userRegisterRoute, value);
});
