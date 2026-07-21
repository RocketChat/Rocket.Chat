import { Random } from '@rocket.chat/random';

import { settingsRegistry } from '.';
import { positiveOrDisabled, notGreaterThanSetting, notLowerThanSetting } from './functions/validationRuleBuilders';

// Explicit sorters: section N uses the N * 1000 range, so section order in the
// admin UI (derived from the lowest sorter in each section) is deterministic.
export const createAccountSettings = () =>
	settingsRegistry.addGroup('Accounts', async function () {
		await this.section('Accounts_Section_Registration_SignUp', async function () {
			// Who can join
			await this.add('Accounts_RegistrationForm', 'Public', {
				type: 'select',
				public: true,
				sorter: 1000,
				subsection: 'Accounts_Subsection_Who_Can_Join',
				values: [
					{
						key: 'Public',
						i18nLabel: 'Accounts_RegistrationForm_Public',
					},
					{
						key: 'Secret URL',
						i18nLabel: 'Accounts_RegistrationForm_Secret_URL',
					},
					{
						key: 'Disabled',
						i18nLabel: 'Accounts_RegistrationForm_Disabled',
					},
				],
			});
			await this.add('Accounts_RegistrationForm_SecretURL', Random.id(), {
				type: 'string',
				secret: true,
				sorter: 1001,
				subsection: 'Accounts_Subsection_Who_Can_Join',
				enableQuery: {
					_id: 'Accounts_RegistrationForm',
					value: 'Secret URL',
				},
			});
			await this.add('Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', {
				type: 'string',
				public: true,
				sorter: 1002,
				subsection: 'Accounts_Subsection_Who_Can_Join',
			});
			await this.add('Accounts_ManuallyApproveNewUsers', false, {
				public: true,
				type: 'boolean',
				sorter: 1003,
				subsection: 'Accounts_Subsection_Who_Can_Join',
			});
			await this.add('Accounts_Registration_InviteUrlType', 'proxy', {
				type: 'select',
				sorter: 1004,
				subsection: 'Accounts_Subsection_Who_Can_Join',
				values: [
					{
						key: 'direct',
						i18nLabel: 'Accounts_Registration_InviteUrlType_Direct',
					},
					{
						key: 'proxy',
						i18nLabel: 'Accounts_Registration_InviteUrlType_Proxy',
					},
				],
			});

			// Sign-up requirements
			await this.add('Accounts_EmailVerification', false, {
				type: 'boolean',
				public: true,
				sorter: 1005,
				subsection: 'Accounts_Subsection_SignUp_Requirements',
			});
			await this.add('Accounts_Verify_Email_For_External_Accounts', true, {
				type: 'boolean',
				sorter: 1006,
				subsection: 'Accounts_Subsection_SignUp_Requirements',
			});
			await this.add('Accounts_RequireNameForSignUp', true, {
				// TODO rename to Accounts_RequireFullName
				type: 'boolean',
				public: true,
				sorter: 1007,
				subsection: 'Accounts_Subsection_SignUp_Requirements',
			});
			await this.add('Accounts_RequirePasswordConfirmation', true, {
				type: 'boolean',
				public: true,
				sorter: 1008,
				subsection: 'Accounts_Subsection_SignUp_Requirements',
			});
			await this.add('Accounts_PasswordReset', true, {
				type: 'boolean',
				public: true,
				sorter: 1009,
				subsection: 'Accounts_Subsection_SignUp_Requirements',
			});

			// Registration methods
			await this.add('Accounts_Registration_AuthenticationServices_Enabled', true, {
				type: 'boolean',
				public: true,
				sorter: 1010,
				subsection: 'Accounts_Subsection_Registration_Methods',
			});
			await this.add('Accounts_Registration_AuthenticationServices_Default_Roles', 'user', {
				type: 'string',
				sorter: 1011,
				subsection: 'Accounts_Subsection_Registration_Methods',
				enableQuery: {
					_id: 'Accounts_Registration_AuthenticationServices_Enabled',
					value: true,
				},
			});
			await this.add('Accounts_Registration_Users_Default_Roles', 'user', {
				type: 'string',
				public: true,
				sorter: 1012,
				subsection: 'Accounts_Subsection_Registration_Methods',
			});

			// Allowed identities
			await this.add('Accounts_AllowedDomainsList', '', {
				type: 'string',
				public: true,
				sorter: 1013,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});
			await this.add('Accounts_BlockedDomainsList', '', {
				type: 'string',
				sorter: 1014,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});
			await this.add('Accounts_UseDefaultBlockedDomainsList', true, {
				type: 'boolean',
				sorter: 1015,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});
			await this.add('Accounts_UseDNSDomainCheck', false, {
				type: 'boolean',
				sorter: 1016,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});
			await this.add('Accounts_BlockedUsernameList', '', {
				type: 'string',
				sorter: 1017,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});
			await this.add('Accounts_DefaultUsernamePrefixSuggestion', 'user', {
				type: 'string',
				sorter: 1018,
				subsection: 'Accounts_Subsection_Allowed_Identities',
			});

			// Registration emails & custom fields
			await this.add('Accounts_Send_Email_When_Activating', true, {
				type: 'boolean',
				sorter: 1019,
				subsection: 'Accounts_Subsection_Registration_Emails_Custom_Fields',
			});
			await this.add('Accounts_Send_Email_When_Deactivating', true, {
				type: 'boolean',
				sorter: 1020,
				subsection: 'Accounts_Subsection_Registration_Emails_Custom_Fields',
			});
			await this.add('Accounts_CustomFields', '', {
				type: 'code',
				public: true,
				sorter: 1021,
				subsection: 'Accounts_Subsection_Registration_Emails_Custom_Fields',
			});

			// Hidden internal settings/counters (not rendered in the UI)
			await this.add('Accounts_SystemBlockedUsernameList', 'admin,administrator,system,user', {
				type: 'string',
				hidden: true,
				sorter: 1900,
			});
			await this.add('Manual_Entry_User_Count', 0, {
				type: 'int',
				hidden: true,
				sorter: 1901,
			});
			await this.add('CSV_Importer_Count', 0, {
				type: 'int',
				hidden: true,
				sorter: 1902,
			});
			await this.add('Hipchat_Enterprise_Importer_Count', 0, {
				type: 'int',
				hidden: true,
				sorter: 1903,
			});
			await this.add('Slack_Importer_Count', 0, {
				type: 'int',
				hidden: true,
				sorter: 1904,
			});
			await this.add('Slack_Users_Importer_Count', 0, {
				type: 'int',
				hidden: true,
				sorter: 1905,
			});
		});

		await this.section('Accounts_Section_Login_Sessions', async function () {
			// Sessions
			await this.add('Accounts_LoginExpiration', 90, {
				type: 'int',
				public: true,
				sorter: 2000,
				subsection: 'Accounts_Subsection_Sessions',
			});
			await this.add('Accounts_ForgetUserSessionOnWindowClose', false, {
				type: 'boolean',
				public: true,
				sorter: 2001,
				subsection: 'Accounts_Subsection_Sessions',
			});

			// Login screen
			await this.add('Accounts_EmailOrUsernamePlaceholder', '', {
				type: 'string',
				public: true,
				sorter: 2002,
				subsection: 'Accounts_Subsection_Login_Screen',
			});
			await this.add('Accounts_PasswordPlaceholder', '', {
				type: 'string',
				public: true,
				sorter: 2003,
				subsection: 'Accounts_Subsection_Login_Screen',
			});
			await this.add('Accounts_ConfirmPasswordPlaceholder', '', {
				type: 'string',
				public: true,
				sorter: 2004,
				subsection: 'Accounts_Subsection_Login_Screen',
			});
		});

		await this.section('Accounts_Section_Authentication_Security', async function () {
			// Two-factor authentication
			const enable2FA = {
				_id: 'Accounts_TwoFactorAuthentication_Enabled',
				value: true,
			};
			const enable2FAByEmail = [
				enable2FA,
				{
					_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
					value: true,
				},
			];

			await this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
				type: 'boolean',
				public: true,
				sorter: 3000,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_By_TOTP_Enabled', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
				sorter: 3001,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
				type: 'int',
				enableQuery: enable2FA,
				sorter: 3002,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_By_Email_Enabled', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
				sorter: 3003,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_twoFactorAuthentication_email_available_for_OAuth_users', true, {
				type: 'boolean',
				enableQuery: enable2FAByEmail,
				public: true,
				sorter: 3004,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', true, {
				type: 'boolean',
				enableQuery: enable2FAByEmail,
				sorter: 3005,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
				wizard: {
					step: 3,
					order: 3,
				},
			});
			await this.add('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration', 3600, {
				// stored in seconds (see EmailCheck.ts); the timespan input converts for display
				type: 'timespan',
				timespanBaseUnit: 'seconds',
				enableQuery: enable2FAByEmail,
				sorter: 3006,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts', 5, {
				type: 'int',
				enableQuery: enable2FAByEmail,
				sorter: 3007,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			await this.add('Accounts_TwoFactorAuthentication_RememberFor', 1800, {
				type: 'int',
				enableQuery: enable2FA,
				sorter: 3008,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});
			// TODO: Remove this setting for version 4.0
			await this.add('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
				sorter: 3009,
				subsection: 'Accounts_Subsection_Two_Factor_Authentication',
			});

			// Brute-force protection
			const enableQueryCollectData = { _id: 'Block_Multiple_Failed_Logins_Enabled', value: true };

			await this.add('Block_Multiple_Failed_Logins_Enabled', true, {
				type: 'boolean',
				sorter: 3010,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_By_User', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
				sorter: 3011,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});

			const enableQueryByUser = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_User', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 10, {
				type: 'int',
				enableQuery: enableQueryByUser,
				sorter: 3012,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByUser,
				sorter: 3013,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_By_Ip', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
				sorter: 3014,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});

			const enableQueryByIp = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_Ip', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50, {
				type: 'int',
				enableQuery: enableQueryByIp,
				sorter: 3015,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByIp,
				sorter: 3016,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_Ip_Whitelist', '', {
				type: 'string',
				enableQuery: enableQueryByIp,
				sorter: 3017,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_Notify_Failed', false, {
				type: 'boolean',
				enableQuery: [enableQueryCollectData],
				sorter: 3018,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});
			await this.add('Block_Multiple_Failed_Logins_Notify_Failed_Channel', '', {
				type: 'string',
				enableQuery: [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_Notify_Failed', value: true }],
				sorter: 3019,
				subsection: 'Accounts_Subsection_Brute_Force_Protection',
			});

			// Login audit log
			const enableQueryAudit = { _id: 'Login_Logs_Enabled', value: true };

			await this.add('Login_Logs_Enabled', false, { type: 'boolean', sorter: 3020, subsection: 'Accounts_Subsection_Login_Audit_Log' });
			await this.add('Login_Logs_Username', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
				sorter: 3021,
				subsection: 'Accounts_Subsection_Login_Audit_Log',
			});
			await this.add('Login_Logs_UserAgent', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
				sorter: 3022,
				subsection: 'Accounts_Subsection_Login_Audit_Log',
			});
			await this.add('Login_Logs_ClientIp', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
				sorter: 3023,
				subsection: 'Accounts_Subsection_Login_Audit_Log',
			});
			await this.add('Login_Logs_ForwardedForIp', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
				sorter: 3024,
				subsection: 'Accounts_Subsection_Login_Audit_Log',
			});
		});

		await this.section('Accounts_Section_Password_Policy', async function () {
			// Policy
			await this.add('Accounts_Password_Policy_Enabled', true, {
				type: 'boolean',
				public: true,
				sorter: 4000,
				subsection: 'Accounts_Subsection_Policy',
			});

			const enableQueryPolicy = {
				_id: 'Accounts_Password_Policy_Enabled',
				value: true,
			};

			await this.add('Accounts_Password_Policy_MinLength', 14, {
				type: 'int',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4001,
				subsection: 'Accounts_Subsection_Policy',
				validation: [positiveOrDisabled(), notGreaterThanSetting('Accounts_Password_Policy_MaxLength')],
			});
			await this.add('Accounts_Password_Policy_MaxLength', -1, {
				type: 'int',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4002,
				subsection: 'Accounts_Subsection_Policy',
				validation: [positiveOrDisabled(), notLowerThanSetting('Accounts_Password_Policy_MinLength')],
			});

			// Character requirements
			await this.add('Accounts_Password_Policy_AtLeastOneLowercase', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4003,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});
			await this.add('Accounts_Password_Policy_AtLeastOneUppercase', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4004,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});
			await this.add('Accounts_Password_Policy_AtLeastOneNumber', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4005,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});
			await this.add('Accounts_Password_Policy_AtLeastOneSpecialCharacter', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4006,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});
			await this.add('Accounts_Password_Policy_ForbidRepeatingCharacters', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryPolicy,
				sorter: 4007,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});
			await this.add('Accounts_Password_Policy_ForbidRepeatingCharactersCount', 3, {
				type: 'int',
				public: true,
				enableQuery: [enableQueryPolicy, { _id: 'Accounts_Password_Policy_ForbidRepeatingCharacters', value: true }],
				sorter: 4008,
				subsection: 'Accounts_Subsection_Character_Requirements',
			});

			// Password history
			await this.add('Accounts_Password_History_Enabled', false, {
				type: 'boolean',
				sorter: 4009,
				subsection: 'Accounts_Subsection_Password_History',
			});
			await this.add('Accounts_Password_History_Amount', 5, {
				type: 'int',
				enableQuery: {
					_id: 'Accounts_Password_History_Enabled',
					value: true,
				},
				sorter: 4010,
				subsection: 'Accounts_Subsection_Password_History',
			});
		});

		await this.section('Accounts_Section_Profile_SelfService', async function () {
			// What users can edit
			const enableQueryProfileChange = {
				_id: 'Accounts_AllowUserProfileChange',
				value: true,
			};

			await this.add('Accounts_AllowUserProfileChange', true, {
				type: 'boolean',
				public: true,
				sorter: 5000,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});
			await this.add('Accounts_AllowRealNameChange', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5001,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});
			await this.add('Accounts_AllowUsernameChange', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5002,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});
			await this.add('Accounts_AllowEmailChange', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5003,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});
			await this.add('Accounts_AllowUserAvatarChange', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5004,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});
			await this.add('Accounts_AllowUserStatusMessageChange', true, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5005,
				subsection: 'Accounts_Subsection_What_Users_Can_Edit',
			});

			// Passwords & account
			await this.add('Accounts_AllowPasswordChange', true, {
				type: 'boolean',
				public: true,
				sorter: 5006,
				subsection: 'Accounts_Subsection_Passwords_Account',
			});
			await this.add('Accounts_AllowPasswordChangeForOAuthUsers', true, {
				type: 'boolean',
				public: true,
				sorter: 5007,
				subsection: 'Accounts_Subsection_Passwords_Account',
			});
			await this.add('Accounts_AllowDeleteOwnAccount', false, {
				type: 'boolean',
				public: true,
				enableQuery: enableQueryProfileChange,
				sorter: 5008,
				subsection: 'Accounts_Subsection_Passwords_Account',
			});

			// Visibility & extras
			await this.add('Accounts_AllowEmailNotifications', true, {
				type: 'boolean',
				public: true,
				sorter: 5009,
				subsection: 'Accounts_Subsection_Visibility_Extras',
			});
			await this.add('Accounts_AllowInvisibleStatusOption', true, {
				type: 'boolean',
				public: true,
				sorter: 5010,
				subsection: 'Accounts_Subsection_Visibility_Extras',
			});
			await this.add('Accounts_AllowFeaturePreview', false, {
				type: 'boolean',
				public: true,
				sorter: 5011,
				subsection: 'Accounts_Subsection_Visibility_Extras',
			});
			await this.add('Accounts_CustomFieldsToShowInUserInfo', '', {
				type: 'string',
				public: true,
				sorter: 5012,
				subsection: 'Accounts_Subsection_Visibility_Extras',
			});
		});

		await this.section('Accounts_Section_User_Directory_Search', async function () {
			// Search & directory
			await this.add('Accounts_SearchFields', 'username, name, bio, nickname', {
				type: 'string',
				sorter: 6000,
				subsection: 'Accounts_Subsection_Search_Directory',
			});
			await this.add('Accounts_Directory_DefaultView', 'channels', {
				type: 'select',
				sorter: 6001,
				subsection: 'Accounts_Subsection_Search_Directory',
				values: [
					{
						key: 'channels',
						i18nLabel: 'Channels',
					},
					{
						key: 'users',
						i18nLabel: 'Users',
					},
				],
				public: true,
			});

			// Anonymous access
			await this.add('Accounts_AllowAnonymousRead', false, {
				type: 'boolean',
				public: true,
				sorter: 6002,
				subsection: 'Accounts_Subsection_Anonymous_Access',
			});
			await this.add('Accounts_AllowAnonymousWrite', false, {
				type: 'boolean',
				public: true,
				sorter: 6003,
				subsection: 'Accounts_Subsection_Anonymous_Access',
				alert: 'Accounts_AllowAnonymousWrite_Deprecation_Alert',
				enableQuery: {
					_id: 'Accounts_AllowAnonymousRead',
					value: true,
				},
			});
		});

		await this.section('Accounts_Section_Avatars', async function () {
			// Uploads & sizing
			await this.add('Accounts_SetDefaultAvatar', true, {
				type: 'boolean',
				sorter: 7000,
				subsection: 'Accounts_Subsection_Uploads_Sizing',
			});
			await this.add('Accounts_AvatarResize', true, {
				type: 'boolean',
				sorter: 7001,
				subsection: 'Accounts_Subsection_Uploads_Sizing',
			});
			await this.add('Accounts_AvatarSize', 200, {
				type: 'int',
				sorter: 7002,
				subsection: 'Accounts_Subsection_Uploads_Sizing',
				enableQuery: {
					_id: 'Accounts_AvatarResize',
					value: true,
				},
			});

			// External providers
			await this.add('Accounts_AvatarExternalProviderUrl', '', {
				type: 'string',
				public: true,
				sorter: 7003,
				subsection: 'Accounts_Subsection_External_Providers',
			});
			await this.add('Accounts_RoomAvatarExternalProviderUrl', '', {
				type: 'string',
				public: true,
				sorter: 7004,
				subsection: 'Accounts_Subsection_External_Providers',
			});

			// Caching & access
			await this.add('Accounts_AvatarCacheTime', 3600, {
				type: 'int',
				sorter: 7005,
				subsection: 'Accounts_Subsection_Caching_Access',
			});
			await this.add('Accounts_AvatarBlockUnauthenticatedAccess', true, {
				type: 'boolean',
				public: true,
				sorter: 7006,
				subsection: 'Accounts_Subsection_Caching_Access',
			});
		});

		await this.section('Accounts_Section_Default_User_Preferences', async function () {
			// Notifications
			await this.add('Accounts_Default_User_Preferences_desktopNotifications', 'all', {
				type: 'select',
				sorter: 8000,
				subsection: 'Accounts_Subsection_Notifications',
				values: [
					{
						key: 'all',
						i18nLabel: 'All_messages',
					},
					{
						key: 'mentions',
						i18nLabel: 'Mentions',
					},
					{
						key: 'nothing',
						i18nLabel: 'Nothing',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_pushNotifications', 'all', {
				type: 'select',
				sorter: 8001,
				subsection: 'Accounts_Subsection_Notifications',
				values: [
					{
						key: 'all',
						i18nLabel: 'All_messages',
					},
					{
						key: 'mentions',
						i18nLabel: 'Mentions',
					},
					{
						key: 'nothing',
						i18nLabel: 'Nothing',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_emailNotificationMode', 'mentions', {
				type: 'select',
				sorter: 8002,
				subsection: 'Accounts_Subsection_Notifications',
				values: [
					{
						key: 'nothing',
						i18nLabel: 'Email_Notification_Mode_Disabled',
					},
					{
						key: 'mentions',
						i18nLabel: 'Email_Notification_Mode_All',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_desktopNotificationRequireInteraction', false, {
				type: 'boolean',
				public: true,
				sorter: 8003,
				subsection: 'Accounts_Subsection_Notifications',
			});
			await this.add('Accounts_Default_User_Preferences_desktopNotificationVoiceCalls', true, {
				type: 'boolean',
				public: true,
				sorter: 8004,
				subsection: 'Accounts_Subsection_Notifications',
			});
			await this.add('Accounts_Default_User_Preferences_unreadAlert', true, {
				type: 'boolean',
				public: true,
				sorter: 8005,
				subsection: 'Accounts_Subsection_Notifications',
			});
			await this.add('Accounts_Default_User_Preferences_notifyCalendarEvents', true, {
				type: 'boolean',
				public: true,
				sorter: 8006,
				subsection: 'Accounts_Subsection_Notifications',
			});
			await this.add('Accounts_Default_User_Preferences_enableMobileRinging', true, {
				type: 'boolean',
				public: true,
				sorter: 8007,
				subsection: 'Accounts_Subsection_Notifications',
			});

			// Sounds
			await this.add('Accounts_Default_User_Preferences_newRoomNotification', 'door', {
				type: 'select',
				sorter: 8008,
				subsection: 'Accounts_Subsection_Sounds',
				values: [
					{
						key: 'none',
						i18nLabel: 'None',
					},
					{
						key: 'door',
						i18nLabel: 'Default',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_newMessageNotification', 'chime', {
				type: 'select',
				sorter: 8009,
				subsection: 'Accounts_Subsection_Sounds',
				values: [
					{
						key: 'none',
						i18nLabel: 'None',
					},
					{
						key: 'chime',
						i18nLabel: 'Default',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_muteFocusedConversations', true, {
				type: 'boolean',
				public: true,
				sorter: 8010,
				subsection: 'Accounts_Subsection_Sounds',
			});
			await this.add('Accounts_Default_User_Preferences_notificationsSoundVolume', 100, {
				type: 'range',
				public: true,
				sorter: 8011,
				subsection: 'Accounts_Subsection_Sounds',
			});
			await this.add('Accounts_Default_User_Preferences_masterVolume', 100, {
				type: 'range',
				public: true,
				sorter: 8012,
				subsection: 'Accounts_Subsection_Sounds',
			});
			await this.add('Accounts_Default_User_Preferences_voipRingerVolume', 100, {
				type: 'range',
				public: true,
				sorter: 8013,
				subsection: 'Accounts_Subsection_Sounds',
			});

			// Appearance
			await this.add('Accounts_Default_User_Preferences_themeAppearence', 'auto', {
				type: 'select',
				sorter: 8014,
				subsection: 'Accounts_Subsection_Appearance',
				values: [
					{
						key: 'auto',
						i18nLabel: 'Theme_match_system',
					},
					{
						key: 'light',
						i18nLabel: 'Theme_light',
					},
					{
						key: 'dark',
						i18nLabel: 'Theme_dark',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_sidebarViewMode', 'medium', {
				type: 'select',
				sorter: 8015,
				subsection: 'Accounts_Subsection_Appearance',
				values: [
					{
						key: 'extended',
						i18nLabel: 'Extended',
					},
					{
						key: 'medium',
						i18nLabel: 'Medium',
					},
					{
						key: 'condensed',
						i18nLabel: 'Condensed',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_sidebarSortby', 'activity', {
				type: 'select',
				sorter: 8016,
				subsection: 'Accounts_Subsection_Appearance',
				values: [
					{
						key: 'activity',
						i18nLabel: 'Activity',
					},
					{
						key: 'alphabetical',
						i18nLabel: 'Alphabetical',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_sidebarDisplayAvatar', true, {
				type: 'boolean',
				public: true,
				sorter: 8017,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarGroupByType', true, {
				type: 'boolean',
				public: true,
				sorter: 8018,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarShowFavorites', true, {
				type: 'boolean',
				public: true,
				sorter: 8019,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarShowUnread', false, {
				type: 'boolean',
				public: true,
				sorter: 8020,
				subsection: 'Accounts_Subsection_Appearance',
			});

			const defaultUserPreferencesSidebarSectionsOrder = [
				'Incoming_Calls',
				'Incoming_Livechats',
				'Open_Livechats',
				'On_Hold_Chats',
				'Unread',
				'Drafts',
				'Favorites',
				'Teams',
				'Discussions',
				'Channels',
				'Direct_Messages',
				'Conversations',
			];

			await this.add('Accounts_Default_User_Preferences_sidebarSectionsOrder', defaultUserPreferencesSidebarSectionsOrder, {
				type: 'multiSelect',
				public: true,
				sorter: 8021,
				subsection: 'Accounts_Subsection_Appearance',
				values: defaultUserPreferencesSidebarSectionsOrder.map((key) => ({ key, i18nLabel: key })),
			});
			await this.add('Accounts_Default_User_Preferences_displayAvatars', true, {
				type: 'boolean',
				public: true,
				sorter: 8022,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_hideUsernames', false, {
				type: 'boolean',
				public: true,
				sorter: 8023,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_hideRoles', false, {
				type: 'boolean',
				public: true,
				sorter: 8024,
				subsection: 'Accounts_Subsection_Appearance',
			});
			await this.add('Accounts_Default_User_Preferences_hideFlexTab', false, {
				type: 'boolean',
				public: true,
				sorter: 8025,
				subsection: 'Accounts_Subsection_Appearance',
			});

			// Messages & media
			await this.add('Accounts_Default_User_Preferences_sendOnEnter', 'normal', {
				type: 'select',
				sorter: 8026,
				subsection: 'Accounts_Subsection_Messages_Media',
				values: [
					{
						key: 'normal',
						i18nLabel: 'Enter_Normal',
					},
					{
						key: 'alternative',
						i18nLabel: 'Enter_Alternative',
					},
					{
						key: 'desktop',
						i18nLabel: 'Only_On_Desktop',
					},
				],
				public: true,
			});
			await this.add('Accounts_Default_User_Preferences_useEmojis', true, {
				type: 'boolean',
				public: true,
				sorter: 8027,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_convertAsciiEmoji', true, {
				type: 'boolean',
				public: true,
				sorter: 8028,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_autoImageLoad', true, {
				type: 'boolean',
				public: true,
				sorter: 8029,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_saveMobileBandwidth', true, {
				type: 'boolean',
				public: true,
				sorter: 8030,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_collapseMediaByDefault', false, {
				type: 'boolean',
				public: true,
				sorter: 8031,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_showThreadsInMainChannel', false, {
				type: 'boolean',
				public: true,
				sorter: 8032,
				subsection: 'Accounts_Subsection_Messages_Media',
			});
			await this.add('Accounts_Default_User_Preferences_alsoSendThreadToChannel', 'default', {
				type: 'select',
				sorter: 8033,
				subsection: 'Accounts_Subsection_Messages_Media',
				values: [
					{
						key: 'default',
						i18nLabel: 'Selected_first_reply_unselected_following_replies',
					},
					{
						key: 'always',
						i18nLabel: 'Selected_by_default',
					},
					{
						key: 'never',
						i18nLabel: 'Unselected_by_default',
					},
				],
				public: true,
			});

			// Activity & other
			await this.add('Accounts_Default_User_Preferences_enableAutoAway', true, {
				type: 'boolean',
				public: true,
				sorter: 8034,
				subsection: 'Accounts_Subsection_Activity_Other',
			});
			await this.add('Accounts_Default_User_Preferences_idleTimeLimit', 300, {
				type: 'int',
				public: true,
				sorter: 8035,
				subsection: 'Accounts_Subsection_Activity_Other',
				enableQuery: {
					_id: 'Accounts_Default_User_Preferences_enableAutoAway',
					value: true,
				},
			});
			await this.add('Accounts_Default_User_Preferences_omnichannelTranscriptEmail', false, {
				type: 'boolean',
				public: true,
				sorter: 8036,
				subsection: 'Accounts_Subsection_Activity_Other',
			});
			await this.add('Accounts_Default_User_Preferences_featuresPreview', '[]', {
				type: 'string',
				public: true,
				sorter: 8037,
				subsection: 'Accounts_Subsection_Activity_Other',
			});
		});

		await this.section('Accounts_Section_Login_Integrations_Iframe', async function () {
			const enableQueryIframe = {
				_id: 'Accounts_iframe_enabled',
				value: true,
			};

			await this.add('Accounts_iframe_enabled', false, {
				type: 'boolean',
				public: true,
				sorter: 9000,
				subsection: 'Accounts_Subsection_Iframe_Login',
			});
			await this.add('Accounts_iframe_url', '', {
				type: 'string',
				public: true,
				sorter: 9001,
				subsection: 'Accounts_Subsection_Iframe_Login',
				enableQuery: enableQueryIframe,
			});
			await this.add('Accounts_Iframe_api_url', '', {
				type: 'string',
				public: true,
				sorter: 9002,
				subsection: 'Accounts_Subsection_Iframe_Login',
				enableQuery: enableQueryIframe,
			});
			await this.add('Accounts_Iframe_api_method', 'POST', {
				type: 'select',
				public: true,
				sorter: 9003,
				subsection: 'Accounts_Subsection_Iframe_Login',
				values: [
					{
						key: 'POST',
						i18nLabel: 'POST',
					},
					{
						key: 'GET',
						i18nLabel: 'GET',
					},
				],
			});
		});
	});
