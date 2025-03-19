import { MeteorError, Team, api, Calendar } from '@rocket.chat/core-services';
import type { IExportOperation, ILoginToken, IPersonalAccessToken, IUser, UserStatus } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';
import {
	isUserCreateParamsPOST,
	isUserSetActiveStatusParamsPOST,
	isUserDeactivateIdleParamsPOST,
	isUsersInfoParamsGetProps,
	isUsersListStatusProps,
	isUsersSendWelcomeEmailProps,
	isUserRegisterParamsPOST,
	isUserLogoutParamsPOST,
	isUsersListTeamsProps,
	isUsersAutocompleteProps,
	isUsersSetAvatarProps,
	isUsersUpdateParamsPOST,
	isUsersUpdateOwnBasicInfoParamsPOST,
	isUsersSetPreferencesParamsPOST,
	isUsersCheckUsernameAvailabilityParamsGET,
	isUsersSendConfirmationEmailParamsPOST,
} from '@rocket.chat/rest-typings';
import { getLoginExpirationInMs, wrapExceptions } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { generatePersonalAccessTokenOfUser } from '../../../../imports/personal-access-tokens/server/api/methods/generateToken';
import { regeneratePersonalAccessTokenOfUser } from '../../../../imports/personal-access-tokens/server/api/methods/regenerateToken';
import { removePersonalAccessTokenOfUser } from '../../../../imports/personal-access-tokens/server/api/methods/removeToken';
import { UserChangedAuditStore } from '../../../../server/lib/auditServerEvents/userChanged';
import { i18n } from '../../../../server/lib/i18n';
import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';
import { sendWelcomeEmail } from '../../../../server/lib/sendWelcomeEmail';
import { registerUser } from '../../../../server/methods/registerUser';
import { requestDataDownload } from '../../../../server/methods/requestDataDownload';
import { resetAvatar } from '../../../../server/methods/resetAvatar';
import { saveUserPreferences } from '../../../../server/methods/saveUserPreferences';
import { executeSaveUserProfile } from '../../../../server/methods/saveUserProfile';
import { sendConfirmationEmail } from '../../../../server/methods/sendConfirmationEmail';
import { sendForgotPasswordEmail } from '../../../../server/methods/sendForgotPasswordEmail';
import { executeSetUserActiveStatus } from '../../../../server/methods/setUserActiveStatus';
import { getUserForCheck, emailCheck } from '../../../2fa/server/code';
import { resetTOTP } from '../../../2fa/server/functions/resetTOTP';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import {
	checkUsernameAvailability,
	checkUsernameAvailabilityWithValidation,
} from '../../../lib/server/functions/checkUsernameAvailability';
import { deleteUser } from '../../../lib/server/functions/deleteUser';
import { getAvatarSuggestionForUser } from '../../../lib/server/functions/getAvatarSuggestionForUser';
import { getFullUserDataByIdOrUsernameOrImportId } from '../../../lib/server/functions/getFullUserData';
import { generateUsernameSuggestion } from '../../../lib/server/functions/getUsernameSuggestion';
import { saveCustomFields } from '../../../lib/server/functions/saveCustomFields';
import { saveCustomFieldsWithoutValidation } from '../../../lib/server/functions/saveCustomFieldsWithoutValidation';
import { saveUser } from '../../../lib/server/functions/saveUser';
import { setStatusText } from '../../../lib/server/functions/setStatusText';
import { setUserAvatar } from '../../../lib/server/functions/setUserAvatar';
import { setUsernameWithValidation } from '../../../lib/server/functions/setUsername';
import { validateCustomFields } from '../../../lib/server/functions/validateCustomFields';
import { validateNameChars } from '../../../lib/server/functions/validateNameChars';
import { validateUsername } from '../../../lib/server/functions/validateUsername';
import { notifyOnUserChange, notifyOnUserChangeAsync } from '../../../lib/server/lib/notifyListener';
import { generateAccessToken } from '../../../lib/server/methods/createToken';
import { deleteUserOwnAccount } from '../../../lib/server/methods/deleteUserOwnAccount';
import { settings } from '../../../settings/server';
import { getURL } from '../../../utils/server/getURL';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';
import { isUserFromParams } from '../helpers/isUserFromParams';
import { getUploadFormData } from '../lib/getUploadFormData';
import { isValidQuery } from '../lib/isValidQuery';
import { findPaginatedUsersByStatus, findUsersToAutocomplete, getInclusiveFields, getNonEmptyFields, getNonEmptyQuery } from '../lib/users';

API.v1.addRoute(
	'users.getAvatar',
	{ authRequired: false },
	{
		async get() {
			const user = await getUserFromParams(this.queryParams);

			const url = getURL(`/avatar/${user.username}`, { cdn: false, full: true });
			this.response.headers.set('Location', url);

			return {
				statusCode: 307,
				body: url,
			};
		},
	},
);

API.v1.addRoute(
	'users.getAvatarSuggestion',
	{
		authRequired: true,
	},
	{
		async get() {
			const suggestions = await getAvatarSuggestionForUser(this.user);

			return API.v1.success({ suggestions });
		},
	},
);

API.v1.addRoute(
	'users.update',
	{ authRequired: true, twoFactorRequired: true, validateParams: isUsersUpdateParamsPOST },
	{
		async post() {
			const userData = { _id: this.bodyParams.userId, ...this.bodyParams.data };

			if (userData.name && !validateNameChars(userData.name)) {
				return API.v1.failure('Name contains invalid characters');
			}
			const auditStore = new UserChangedAuditStore({
				_id: this.user._id,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
				username: this.user.username || '',
			});

			await saveUser(this.userId, userData, { auditStore });

			if (typeof this.bodyParams.data.active !== 'undefined') {
				const {
					userId,
					data: { active },
					confirmRelinquish,
				} = this.bodyParams;
				await executeSetUserActiveStatus(this.userId, userId, active, Boolean(confirmRelinquish));
			}

			const { fields } = await this.parseJsonQuery();

			const user = await Users.findOneById(this.bodyParams.userId, { projection: fields });
			if (!user) {
				return API.v1.failure('User not found');
			}

			return API.v1.success({ user });
		},
	},
);

API.v1.addRoute(
	'users.updateOwnBasicInfo',
	{ authRequired: true, validateParams: isUsersUpdateOwnBasicInfoParamsPOST },
	{
		async post() {
			const userData = {
				email: this.bodyParams.data.email,
				realname: this.bodyParams.data.name,
				username: this.bodyParams.data.username,
				nickname: this.bodyParams.data.nickname,
				bio: this.bodyParams.data.bio,
				statusText: this.bodyParams.data.statusText,
				statusType: this.bodyParams.data.statusType,
				newPassword: this.bodyParams.data.newPassword,
				typedPassword: this.bodyParams.data.currentPassword,
			};

			if (userData.realname && !validateNameChars(userData.realname)) {
				return API.v1.failure('Name contains invalid characters');
			}

			// saveUserProfile now uses the default two factor authentication procedures, so we need to provide that
			const twoFactorOptions = !userData.typedPassword
				? null
				: {
						twoFactorCode: userData.typedPassword,
						twoFactorMethod: 'password',
					};

			await executeSaveUserProfile.call(this as unknown as Meteor.MethodThisType, userData, this.bodyParams.customFields, twoFactorOptions);

			return API.v1.success({
				user: await Users.findOneById(this.userId, { projection: API.v1.defaultFieldsToExclude }),
			});
		},
	},
);

API.v1.addRoute(
	'users.setPreferences',
	{ authRequired: true, validateParams: isUsersSetPreferencesParamsPOST },
	{
		async post() {
			if (
				this.bodyParams.userId &&
				this.bodyParams.userId !== this.userId &&
				!(await hasPermissionAsync(this.userId, 'edit-other-user-info'))
			) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed');
			}
			const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
			if (!(await Users.findOneById(userId))) {
				throw new Meteor.Error('error-invalid-user', 'The optional "userId" param provided does not match any users');
			}

			await saveUserPreferences(this.bodyParams.data, userId);
			const user = await Users.findOneById(userId, {
				projection: {
					'settings.preferences': 1,
					'language': 1,
				},
			});

			if (!user) {
				return API.v1.failure('User not found');
			}

			return API.v1.success({
				user: {
					_id: user._id,
					settings: {
						preferences: {
							...user.settings?.preferences,
							language: user.language,
						},
					},
				} as unknown as Required<Pick<IUser, '_id' | 'settings'>>,
			});
		},
	},
);

API.v1.addRoute(
	'users.setAvatar',
	{ authRequired: true, validateParams: isUsersSetAvatarProps },
	{
		async post() {
			const canEditOtherUserAvatar = await hasPermissionAsync(this.userId, 'edit-other-user-avatar');

			if (!settings.get('Accounts_AllowUserAvatarChange') && !canEditOtherUserAvatar) {
				throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
					method: 'users.setAvatar',
				});
			}

			let user = await (async (): Promise<Pick<IUser, '_id' | 'username'> | undefined | null> => {
				if (isUserFromParams(this.bodyParams, this.userId, this.user)) {
					return Users.findOneById(this.userId);
				}
				if (canEditOtherUserAvatar) {
					return getUserFromParams(this.bodyParams);
				}
			})();

			if (!user) {
				return API.v1.forbidden();
			}

			if (this.bodyParams.avatarUrl) {
				await setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
				return API.v1.success();
			}

			const image = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'image', sizeLimit: settings.get('FileUpload_MaxFileSize') },
			);

			if (!image) {
				return API.v1.failure("The 'image' param is required");
			}

			const { fields, fileBuffer, mimetype } = image;

			const sentTheUserByFormData = fields.userId || fields.username;
			if (sentTheUserByFormData) {
				if (fields.userId) {
					user = await Users.findOneById<Pick<IUser, '_id' | 'username'>>(fields.userId, { projection: { username: 1 } });
				} else if (fields.username) {
					user = await Users.findOneByUsernameIgnoringCase<Pick<IUser, '_id' | 'username'>>(fields.username, {
						projection: { username: 1 },
					});
				}

				if (!user) {
					throw new Meteor.Error('error-invalid-user', 'The optional "userId" or "username" param provided does not match any users');
				}

				const isAnotherUser = this.userId !== user._id;
				if (isAnotherUser && !(await hasPermissionAsync(this.userId, 'edit-other-user-avatar'))) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}
			}

			await setUserAvatar(user, fileBuffer, mimetype, 'rest');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.create',
	{ authRequired: true, validateParams: isUserCreateParamsPOST },
	{
		async post() {
			// New change made by pull request #5152
			if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
				this.bodyParams.joinDefaultChannels = true;
			}

			if (this.bodyParams.name && !validateNameChars(this.bodyParams.name)) {
				return API.v1.failure('Name contains invalid characters');
			}

			if (this.bodyParams.customFields) {
				validateCustomFields(this.bodyParams.customFields);
			}

			const newUserId = await saveUser(this.userId, this.bodyParams);
			const userId = typeof newUserId !== 'string' ? this.userId : newUserId;

			if (this.bodyParams.customFields) {
				await saveCustomFieldsWithoutValidation(userId, this.bodyParams.customFields);
			}

			if (typeof this.bodyParams.active !== 'undefined') {
				await executeSetUserActiveStatus(this.userId, userId, this.bodyParams.active);
			}

			const { fields } = await this.parseJsonQuery();

			const user = await Users.findOneById(userId, { projection: fields });
			if (!user) {
				return API.v1.failure('User not found');
			}

			return API.v1.success({ user });
		},
	},
);

API.v1.addRoute(
	'users.delete',
	{ authRequired: true, permissionsRequired: ['delete-user'] },
	{
		async post() {
			const user = await getUserFromParams(this.bodyParams);
			const { confirmRelinquish = false } = this.bodyParams;

			await deleteUser(user._id, confirmRelinquish, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.deleteOwnAccount',
	{ authRequired: true },
	{
		async post() {
			const { password } = this.bodyParams;
			if (!password) {
				return API.v1.failure('Body parameter "password" is required.');
			}
			if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const { confirmRelinquish = false } = this.bodyParams;

			await deleteUserOwnAccount(this.userId, password, confirmRelinquish);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.setActiveStatus',
	{
		authRequired: true,
		validateParams: isUserSetActiveStatusParamsPOST,
		permissionsRequired: {
			POST: { permissions: ['edit-other-user-active-status', 'manage-moderation-actions'], operation: 'hasAny' },
		},
	},
	{
		async post() {
			const { userId, activeStatus, confirmRelinquish = false } = this.bodyParams;
			await executeSetUserActiveStatus(this.userId, userId, activeStatus, confirmRelinquish);

			const user = await Users.findOneById(this.bodyParams.userId, { projection: { active: 1 } });
			if (!user) {
				return API.v1.failure('User not found');
			}
			return API.v1.success({
				user,
			});
		},
	},
);

API.v1.addRoute(
	'users.deactivateIdle',
	{ authRequired: true, validateParams: isUserDeactivateIdleParamsPOST, permissionsRequired: ['edit-other-user-active-status'] },
	{
		async post() {
			const { daysIdle, role = 'user' } = this.bodyParams;

			const lastLoggedIn = new Date();
			lastLoggedIn.setDate(lastLoggedIn.getDate() - daysIdle);

			// since we're deactiving users that are not logged in, there is no need to send data through WS
			const { modifiedCount: count } = await Users.setActiveNotLoggedInAfterWithRole(lastLoggedIn, role, false);

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
			const searchTerms: [string, 'id' | 'username' | 'importId'] | false =
				('userId' in this.queryParams && !!this.queryParams.userId && [this.queryParams.userId, 'id']) ||
				('username' in this.queryParams && !!this.queryParams.username && [this.queryParams.username, 'username']) ||
				('importId' in this.queryParams && !!this.queryParams.importId && [this.queryParams.importId, 'importId']);

			if (!searchTerms) {
				return API.v1.failure('Invalid search query.');
			}

			const user = await getFullUserDataByIdOrUsernameOrImportId(this.userId, ...searchTerms);

			if (!user) {
				return API.v1.failure('User not found.');
			}
			const myself = user._id === this.userId;
			if (this.queryParams.includeUserRooms === 'true' && (myself || (await hasPermissionAsync(this.userId, 'view-other-user-channels')))) {
				return API.v1.success({
					user: {
						...user,
						rooms: await Subscriptions.findByUserId(user._id, {
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
						}).toArray(),
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
		permissionsRequired: ['view-d-room'],
	},
	{
		async get() {
			if (
				settings.get('API_Apply_permission_view-outside-room_on_users-list') &&
				!(await hasPermissionAsync(this.userId, 'view-outside-room'))
			) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const nonEmptyQuery = getNonEmptyQuery(query, await hasPermissionAsync(this.userId, 'view-full-other-user-info'));
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
						inclusiveFieldsKeys.includes('customFields') && 'customFields.*',
					].filter(Boolean) as string[],
					this.queryOperations,
				)
			) {
				throw new Meteor.Error('error-invalid-query', isValidQuery.errors.join('\n'));
			}

			const actualSort = sort || { username: 1 };

			if (sort?.status) {
				actualSort.active = sort.status;
			}

			if (sort?.name) {
				actualSort.nameInsensitive = sort.name;
			}

			const limit =
				count !== 0
					? [
							{
								$limit: count,
							},
						]
					: [];

			const result = await Users.col
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
	'users.listByStatus',
	{
		authRequired: true,
		validateParams: isUsersListStatusProps,
		permissionsRequired: ['view-d-room'],
	},
	{
		async get() {
			if (
				settings.get('API_Apply_permission_view-outside-room_on_users-list') &&
				!(await hasPermissionAsync(this.userId, 'view-outside-room'))
			) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { status, hasLoggedIn, type, roles, searchTerm } = this.queryParams;

			return API.v1.success(
				await findPaginatedUsersByStatus({
					uid: this.userId,
					offset,
					count,
					sort,
					status,
					roles,
					searchTerm,
					hasLoggedIn,
					type,
				}),
			);
		},
	},
);

API.v1.addRoute(
	'users.sendWelcomeEmail',
	{
		authRequired: true,
		validateParams: isUsersSendWelcomeEmailProps,
		permissionsRequired: ['send-mail'],
	},
	{
		async post() {
			const { email } = this.bodyParams;
			await sendWelcomeEmail(email);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.register',
	{
		authRequired: false,
		rateLimiterOptions: {
			numRequestsAllowed: settings.get('Rate_Limiter_Limit_RegisterUser') ?? 1,
			intervalTimeInMS: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default') ?? 60000,
		},
		validateParams: isUserRegisterParamsPOST,
	},
	{
		async post() {
			const { secret: secretURL, ...params } = this.bodyParams;

			if (this.userId) {
				return API.v1.failure('Logged in users can not register again.');
			}

			if (params.name && !validateNameChars(params.name)) {
				return API.v1.failure('Name contains invalid characters');
			}

			if (!validateUsername(this.bodyParams.username)) {
				return API.v1.failure(`The username provided is not valid`);
			}

			if (!(await checkUsernameAvailability(this.bodyParams.username))) {
				return API.v1.failure('Username is already in use');
			}

			if (this.bodyParams.customFields) {
				try {
					await validateCustomFields(this.bodyParams.customFields);
				} catch (e) {
					return API.v1.failure(e);
				}
			}

			// Register the user
			const userId = await registerUser({
				...params,
				...(secretURL && { secretURL }),
			});

			if (typeof userId !== 'string') {
				return API.v1.failure('Error creating user');
			}

			// Now set their username
			const { fields } = await this.parseJsonQuery();
			await setUsernameWithValidation(userId, this.bodyParams.username);

			const user = await Users.findOneById(userId, { projection: fields });
			if (!user) {
				return API.v1.failure('User not found');
			}

			if (this.bodyParams.customFields) {
				await saveCustomFields(userId, this.bodyParams.customFields);
			}

			return API.v1.success({ user });
		},
	},
);

API.v1.addRoute(
	'users.resetAvatar',
	{ authRequired: true },
	{
		async post() {
			const user = await getUserFromParams(this.bodyParams);

			if (settings.get('Accounts_AllowUserAvatarChange') && user._id === this.userId) {
				await resetAvatar(this.userId, this.userId);
			} else if (
				(await hasPermissionAsync(this.userId, 'edit-other-user-avatar')) ||
				(await hasPermissionAsync(this.userId, 'manage-moderation-actions'))
			) {
				await resetAvatar(this.userId, user._id);
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
	{ authRequired: true, deprecationVersion: '8.0.0' },
	{
		async post() {
			const user = await getUserFromParams(this.bodyParams);

			const data = await generateAccessToken(this.userId, user._id);

			return data ? API.v1.success({ data }) : API.v1.forbidden();
		},
	},
);

API.v1.addRoute(
	'users.getPreferences',
	{ authRequired: true },
	{
		async get() {
			const user = await Users.findOneById(this.userId);
			if (user?.settings) {
				const { preferences = {} } = user?.settings;
				preferences.language = user?.language;

				return API.v1.success({
					preferences,
				});
			}
			return API.v1.failure(i18n.t('Accounts_Default_User_Preferences_not_available').toUpperCase());
		},
	},
);

API.v1.addRoute(
	'users.forgotPassword',
	{ authRequired: false },
	{
		async post() {
			const isPasswordResetEnabled = settings.get('Accounts_PasswordReset');

			if (!isPasswordResetEnabled) {
				return API.v1.failure('Password reset is not enabled');
			}

			const { email } = this.bodyParams;
			if (!email) {
				return API.v1.failure("The 'email' param is required");
			}

			await sendForgotPasswordEmail(email.toLowerCase());
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.getUsernameSuggestion',
	{ authRequired: true },
	{
		async get() {
			const result = await generateUsernameSuggestion(this.user);

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'users.checkUsernameAvailability',
	{
		authRequired: true,
		validateParams: isUsersCheckUsernameAvailabilityParamsGET,
	},
	{
		async get() {
			const { username } = this.queryParams;

			const result = await checkUsernameAvailabilityWithValidation(this.userId, username);

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'users.generatePersonalAccessToken',
	{ authRequired: true, twoFactorRequired: true },
	{
		async post() {
			const { tokenName, bypassTwoFactor = false } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			const token = await generatePersonalAccessTokenOfUser({ tokenName, userId: this.userId, bypassTwoFactor });

			return API.v1.success({ token });
		},
	},
);

API.v1.addRoute(
	'users.regeneratePersonalAccessToken',
	{ authRequired: true, twoFactorRequired: true },
	{
		async post() {
			const { tokenName } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			const token = await regeneratePersonalAccessTokenOfUser(tokenName, this.userId);

			return API.v1.success({ token });
		},
	},
);

API.v1.addRoute(
	'users.getPersonalAccessTokens',
	{ authRequired: true, permissionsRequired: ['create-personal-access-tokens'] },
	{
		async get() {
			const user = (await Users.getLoginTokensByUserId(this.userId).toArray())[0] as unknown as IUser | undefined;

			const isPersonalAccessToken = (loginToken: ILoginToken | IPersonalAccessToken): loginToken is IPersonalAccessToken =>
				'type' in loginToken && loginToken.type === 'personalAccessToken';

			return API.v1.success({
				tokens:
					user?.services?.resume?.loginTokens?.filter(isPersonalAccessToken).map((loginToken) => ({
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
		async post() {
			const { tokenName } = this.bodyParams;
			if (!tokenName) {
				return API.v1.failure("The 'tokenName' param is required");
			}
			await removePersonalAccessTokenOfUser(tokenName, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.2fa.enableEmail',
	{ authRequired: true },
	{
		async post() {
			const hasUnverifiedEmail = this.user.emails?.some((email) => !email.verified);
			if (hasUnverifiedEmail) {
				throw new MeteorError('error-invalid-user', 'You need to verify your emails before setting up 2FA');
			}

			await Users.enableEmail2FAByUserId(this.userId);

			// When 2FA is enable we logout all other clients
			const xAuthToken = this.request.headers.get('x-auth-token') as string;
			if (!xAuthToken) {
				return API.v1.success();
			}

			const hashedToken = Accounts._hashLoginToken(xAuthToken);

			if (!(await Users.removeNonPATLoginTokensExcept(this.userId, hashedToken))) {
				throw new MeteorError('error-logging-out-other-clients', 'Error logging out other clients');
			}

			// TODO this can be optmized so places that care about loginTokens being removed are invoked directly
			// instead of having to listen to every watch.users event
			void notifyOnUserChangeAsync(async () => {
				const user = await Users.findOneById(this.userId, { projection: { 'services.resume.loginTokens': 1, 'services.email2fa': 1 } });
				if (!user) {
					return;
				}

				return {
					clientAction: 'updated',
					id: this.user._id,
					diff: { 'services.resume.loginTokens': user.services?.resume?.loginTokens, 'services.email2fa': user.services?.email2fa },
				};
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'users.2fa.disableEmail',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		async post() {
			await Users.disableEmail2FAByUserId(this.userId);

			void notifyOnUserChangeAsync(async () => {
				const user = await Users.findOneById(this.userId, { projection: { 'services.email2fa': 1 } });
				if (!user) {
					return;
				}

				return {
					clientAction: 'updated',
					id: this.user._id,
					diff: { 'services.email2fa': user.services?.email2fa },
				};
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute('users.2fa.sendEmailCode', {
	async post() {
		const { emailOrUsername } = this.bodyParams;

		if (!emailOrUsername) {
			throw new Meteor.Error('error-parameter-required', 'emailOrUsername is required');
		}

		const method = emailOrUsername.includes('@') ? 'findOneByEmailAddress' : 'findOneByUsername';
		const userId = this.userId || (await Users[method](emailOrUsername, { projection: { _id: 1 } }))?._id;

		if (!userId) {
			// this.logger.error('[2fa] User was not found when requesting 2fa email code');
			return API.v1.success();
		}
		const user = await getUserForCheck(userId);
		if (!user) {
			// this.logger.error('[2fa] User was not found when requesting 2fa email code');
			return API.v1.success();
		}

		await emailCheck.sendEmailCode(user);

		return API.v1.success();
	},
});

API.v1.addRoute(
	'users.sendConfirmationEmail',
	{
		authRequired: true,
		validateParams: isUsersSendConfirmationEmailParamsPOST,
	},
	{
		async post() {
			const { email } = this.bodyParams;

			if (await sendConfirmationEmail(email)) {
				return API.v1.success();
			}
			return API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'users.presence',
	{ authRequired: true },
	{
		async get() {
			// if presence broadcast is disabled, return an empty array (all users are "offline")
			if (settings.get('Presence_broadcast_disabled')) {
				return API.v1.success({
					users: [],
					full: true,
				});
			}

			const { from, ids } = this.queryParams;

			const options = {
				projection: {
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
					users: await Users.findNotOfflineByIds(Array.isArray(ids) ? ids : ids.split(','), options).toArray(),
					full: false,
				});
			}

			if (from) {
				const ts = new Date(from);
				const diff = (Date.now() - Number(ts)) / 1000 / 60;

				if (diff < 10) {
					return API.v1.success({
						users: await Users.findNotIdUpdatedFrom(this.userId, ts, options).toArray(),
						full: false,
					});
				}
			}

			return API.v1.success({
				users: await Users.findUsersNotOffline(options).toArray(),
				full: true,
			});
		},
	},
);

API.v1.addRoute(
	'users.requestDataDownload',
	{ authRequired: true },
	{
		async get() {
			const { fullExport = false } = this.queryParams;
			const result = (await requestDataDownload({ userData: this.user, fullExport: fullExport === 'true' })) as {
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
			const xAuthToken = this.request.headers.get('x-auth-token') as string;

			if (!xAuthToken) {
				throw new Meteor.Error('error-parameter-required', 'x-auth-token is required');
			}
			const hashedToken = Accounts._hashLoginToken(xAuthToken);

			if (!(await Users.removeNonPATLoginTokensExcept(this.userId, hashedToken))) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			const me = (await Users.findOneById(this.userId, { projection: { 'services.resume.loginTokens': 1 } })) as Pick<IUser, 'services'>;

			void notifyOnUserChange({
				clientAction: 'updated',
				id: this.userId,
				diff: { 'services.resume.loginTokens': me.services?.resume?.loginTokens },
			});

			const token = me.services?.resume?.loginTokens?.find((token) => token.hashedToken === hashedToken);

			const loginExp = settings.get<number>('Accounts_LoginExpiration');

			const tokenExpires = (token && 'when' in token && new Date(token.when.getTime() + getLoginExpirationInMs(loginExp))) || undefined;

			return API.v1.success({
				token: xAuthToken,
				tokenExpires: tokenExpires?.toISOString() || '',
			});
		},
	},
);

API.v1.addRoute(
	'users.autocomplete',
	{ authRequired: true, validateParams: isUsersAutocompleteProps },
	{
		async get() {
			const { selector: selectorRaw } = this.queryParams;

			const selector: { exceptions: Required<IUser>['username'][]; conditions: Filter<IUser>; term: string } = JSON.parse(selectorRaw);

			try {
				if (selector?.conditions && !isValidQuery(selector.conditions, ['*'], ['$or', '$and'])) {
					throw new Error('error-invalid-query');
				}
			} catch (e) {
				return API.v1.failure(e);
			}

			return API.v1.success(
				await findUsersToAutocomplete({
					uid: this.userId,
					selector,
				}),
			);
		},
	},
);

API.v1.addRoute(
	'users.removeOtherTokens',
	{ authRequired: true },
	{
		async post() {
			return API.v1.success(await Meteor.callAsync('removeOtherTokens'));
		},
	},
);

API.v1.addRoute(
	'users.resetE2EKey',
	{ authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } },
	{
		async post() {
			if ('userId' in this.bodyParams || 'username' in this.bodyParams || 'user' in this.bodyParams) {
				// reset other user keys
				const user = await getUserFromParams(this.bodyParams);
				if (!user) {
					throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
				}

				if (!(await hasPermissionAsync(this.userId, 'edit-other-user-e2ee'))) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				if (!(await resetUserE2EEncriptionKey(user._id, true))) {
					return API.v1.failure();
				}

				return API.v1.success();
			}
			await resetUserE2EEncriptionKey(this.userId, false);
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
				if (!(await hasPermissionAsync(this.userId, 'edit-other-user-totp'))) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
					throw new Meteor.Error('error-two-factor-not-enabled', 'Two factor authentication is not enabled');
				}

				const user = await getUserFromParams(this.bodyParams);
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
			const adminId = (await hasPermissionAsync(this.userId, 'view-all-teams')) ? undefined : this.userId;

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
		async post() {
			const userId = this.bodyParams.userId || this.userId;

			if (userId !== this.userId && !(await hasPermissionAsync(this.userId, 'logout-other-user'))) {
				return API.v1.forbidden();
			}

			// this method logs the user out automatically, if successful returns 1, otherwise 0
			if (!(await Users.unsetLoginTokens(userId))) {
				throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
			}

			void notifyOnUserChange({ clientAction: 'updated', id: userId, diff: { 'services.resume.loginTokens': [] } });

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
		async get() {
			if (isUserFromParams(this.queryParams, this.userId, this.user)) {
				const user = await Users.findOneById(this.userId);
				return API.v1.success({
					presence: (user?.status || 'offline') as UserStatus,
					connectionStatus: user?.statusConnection || 'offline',
					...(user?.lastLogin && { lastLogin: user?.lastLogin }),
				});
			}

			const user = await getUserFromParams(this.queryParams);

			return API.v1.success({
				presence: user.status || ('offline' as UserStatus),
			});
		},
	},
);

API.v1.addRoute(
	'users.setStatus',
	{ authRequired: true },
	{
		async post() {
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

			const user = await (async (): Promise<
				Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'statusText' | 'roles'> | undefined | null
			> => {
				if (isUserFromParams(this.bodyParams, this.userId, this.user)) {
					return Users.findOneById(this.userId);
				}
				if (await hasPermissionAsync(this.userId, 'edit-other-user-info')) {
					return getUserFromParams(this.bodyParams);
				}
			})();

			if (!user) {
				return API.v1.forbidden();
			}

			// TODO refactor to not update the user twice (one inside of `setStatusText` and then later just the status + statusDefault)

			if (this.bodyParams.message || this.bodyParams.message === '') {
				await setStatusText(user._id, this.bodyParams.message);
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

					await Users.updateOne(
						{ _id: user._id },
						{
							$set: {
								status,
								statusDefault: status,
							},
						},
					);

					const { _id, username, statusText, roles, name } = user;
					void api.broadcast('presence.status', {
						user: { status, _id, username, statusText, roles, name },
						previousStatus: user.status,
					});

					void wrapExceptions(() => Calendar.cancelUpcomingStatusChanges(user._id)).suppress();
				} else {
					throw new Meteor.Error('error-invalid-status', 'Valid status types include online, away, offline, and busy.', {
						method: 'users.setStatus',
					});
				}
			}

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
		async get() {
			if (isUserFromParams(this.queryParams, this.userId, this.user)) {
				const user: IUser | null = await Users.findOneById(this.userId);
				return API.v1.success({
					_id: user?._id,
					// message: user.statusText,
					connectionStatus: (user?.statusConnection || 'offline') as 'online' | 'offline' | 'away' | 'busy',
					status: (user?.status || 'offline') as 'online' | 'offline' | 'away' | 'busy',
				});
			}

			const user = await getUserFromParams(this.queryParams);

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
