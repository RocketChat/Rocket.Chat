import { Random } from '@rocket.chat/random';

import { settingsRegistry } from '../../app/settings/server';

export const createAccountSettings = () =>
	settingsRegistry.addGroup('Accounts', async function () {
		await this.section('Two Factor Authentication', async function () {
			const enable2FA = {
				_id: 'Accounts_TwoFactorAuthentication_Enabled',
				value: true,
			};

			await this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
				type: 'int',
				enableQuery: enable2FA,
			});

			await this.add('Accounts_TwoFactorAuthentication_By_TOTP_Enabled', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
			});

			await this.add('Accounts_TwoFactorAuthentication_By_Email_Enabled', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
			});

			await this.add('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', true, {
				type: 'boolean',
				enableQuery: [
					enable2FA,
					{
						_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
						value: true,
					},
				],
				wizard: {
					step: 3,
					order: 3,
				},
			});

			await this.add('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration', 3600, {
				type: 'int',
				enableQuery: [
					enable2FA,
					{
						_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
						value: true,
					},
				],
			});

			await this.add('Accounts_TwoFactorAuthentication_RememberFor', 1800, {
				type: 'int',
				enableQuery: enable2FA,
			});

			// TODO: Remove this setting for version 4.0
			await this.add('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback', true, {
				type: 'boolean',
				enableQuery: enable2FA,
				public: true,
			});
		});
		const enableQueryCollectData = { _id: 'Block_Multiple_Failed_Logins_Enabled', value: true };

		await this.section('Login_Attempts', async function () {
			await this.add('Block_Multiple_Failed_Logins_Enabled', false, {
				type: 'boolean',
			});

			await this.add('Block_Multiple_Failed_Logins_By_User', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByUser = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_User', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 10, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			await this.add('Block_Multiple_Failed_Logins_By_Ip', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByIp = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_Ip', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Ip_Whitelist', '', {
				type: 'string',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Notify_Failed', false, {
				type: 'boolean',
				enableQuery: [enableQueryCollectData],
			});

			await this.add('Block_Multiple_Failed_Logins_Notify_Failed_Channel', '', {
				type: 'string',
				i18nDescription: 'Block_Multiple_Failed_Logins_Notify_Failed_Channel_Desc',
				enableQuery: [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_Notify_Failed', value: true }],
			});
		});

		await this.section('Login_Logs', async function () {
			const enableQueryAudit = { _id: 'Login_Logs_Enabled', value: true };

			await this.add('Login_Logs_Enabled', false, { type: 'boolean' });

			await this.add('Login_Logs_Username', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_UserAgent', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_ClientIp', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_ForwardedForIp', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
			});
		});
		await this.section('Iframe', async function () {
			await this.add('Accounts_iframe_enabled', false, { type: 'boolean', public: true });
			await this.add('Accounts_iframe_url', '', { type: 'string', public: true });
			await this.add('Accounts_Iframe_api_url', '', { type: 'string', public: true });
			await this.add('Accounts_Iframe_api_method', 'POST', { type: 'string', public: true });
		});
		await this.add('Accounts_AllowAnonymousRead', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowAnonymousWrite', false, {
			type: 'boolean',
			public: true,
			enableQuery: {
				_id: 'Accounts_AllowAnonymousRead',
				value: true,
			},
		});
		await this.add('Accounts_AllowDeleteOwnAccount', false, {
			type: 'boolean',
			public: true,
			enableQuery: {
				_id: 'Accounts_AllowUserProfileChange',
				value: true,
			},
		});
		await this.add('Accounts_AllowUserProfileChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowUserAvatarChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowRealNameChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowUserStatusMessageChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowUsernameChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowEmailChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowPasswordChange', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowPasswordChangeForOAuthUsers', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowEmailNotifications', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_AllowFeaturePreview', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_CustomFieldsToShowInUserInfo', '', {
			type: 'string',
			public: true,
		});
		await this.add('Accounts_LoginExpiration', 90, {
			type: 'int',
			public: true,
		});
		await this.add('Accounts_EmailOrUsernamePlaceholder', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Placeholder_for_email_or_username_login_field',
		});
		await this.add('Accounts_PasswordPlaceholder', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Placeholder_for_password_login_field',
		});

		await this.add('Accounts_ConfirmPasswordPlaceholder', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Placeholder_for_password_login_confirm_field',
		});
		await this.add('Accounts_ForgetUserSessionOnWindowClose', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_SearchFields', 'username, name, bio, nickname', {
			type: 'string',
		});
		await this.add('Accounts_Directory_DefaultView', 'channels', {
			type: 'select',
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
		await this.add('Accounts_AllowInvisibleStatusOption', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Accounts_AllowInvisibleStatusOption',
		});

		await this.section('Registration', async function () {
			await this.add('Accounts_Send_Email_When_Activating', true, {
				type: 'boolean',
			});
			await this.add('Accounts_Send_Email_When_Deactivating', true, {
				type: 'boolean',
			});
			await this.add('Accounts_DefaultUsernamePrefixSuggestion', 'user', {
				type: 'string',
			});
			await this.add('Accounts_RequireNameForSignUp', true, {
				// TODO rename to Accounts_RequireFullName
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_RequirePasswordConfirmation', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_EmailVerification', false, {
				type: 'boolean',
				public: true,
				enableQuery: {
					_id: 'SMTP_Host',
					value: {
						$exists: true,
						$ne: '',
					},
				},
			});
			await this.add('Accounts_Verify_Email_For_External_Accounts', true, {
				type: 'boolean',
			});
			await this.add('Accounts_ManuallyApproveNewUsers', false, {
				public: true,
				type: 'boolean',
			});
			await this.add('Accounts_AllowedDomainsList', '', {
				type: 'string',
				public: true,
			});
			await this.add('Accounts_BlockedDomainsList', '', {
				type: 'string',
			});
			await this.add('Accounts_BlockedUsernameList', '', {
				type: 'string',
			});
			await this.add('Accounts_SystemBlockedUsernameList', 'admin,administrator,system,user', {
				type: 'string',
				hidden: true,
			});
			await this.add('Manual_Entry_User_Count', 0, {
				type: 'int',
				hidden: true,
			});
			await this.add('CSV_Importer_Count', 0, {
				type: 'int',
				hidden: true,
			});
			await this.add('Hipchat_Enterprise_Importer_Count', 0, {
				type: 'int',
				hidden: true,
			});
			await this.add('Slack_Importer_Count', 0, {
				type: 'int',
				hidden: true,
			});
			await this.add('Slack_Users_Importer_Count', 0, {
				type: 'int',
				hidden: true,
			});
			await this.add('Accounts_UseDefaultBlockedDomainsList', true, {
				type: 'boolean',
			});
			await this.add('Accounts_UseDNSDomainCheck', false, {
				type: 'boolean',
			});
			await this.add('Accounts_RegistrationForm', 'Public', {
				type: 'select',
				public: true,
				values: [
					{
						key: 'Public',
						i18nLabel: 'Accounts_RegistrationForm_Public',
					},
					{
						key: 'Disabled',
						i18nLabel: 'Accounts_RegistrationForm_Disabled',
					},
					{
						key: 'Secret URL',
						i18nLabel: 'Accounts_RegistrationForm_Secret_URL',
					},
				],
			});
			await this.add('Accounts_RegistrationForm_SecretURL', Random.id(), {
				type: 'string',
				secret: true,
			});
			await this.add('Accounts_Registration_InviteUrlType', 'proxy', {
				type: 'select',
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

			await this.add('Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', {
				type: 'string',
				public: true,
			});
			await this.add('Accounts_Registration_AuthenticationServices_Enabled', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_Registration_AuthenticationServices_Default_Roles', 'user', {
				type: 'string',
				enableQuery: {
					_id: 'Accounts_Registration_AuthenticationServices_Enabled',
					value: true,
				},
			});
			await this.add('Accounts_Registration_Users_Default_Roles', 'user', {
				type: 'string',
				public: true,
			});
			await this.add('Accounts_PasswordReset', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_CustomFields', '', {
				type: 'code',
				public: true,
				i18nLabel: 'Custom_Fields',
			});
		});

		await this.section('Accounts_Default_User_Preferences', async function () {
			await this.add('Accounts_Default_User_Preferences_enableAutoAway', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enable_Auto_Away',
			});
			await this.add('Accounts_Default_User_Preferences_idleTimeLimit', 300, {
				type: 'int',
				public: true,
				i18nLabel: 'Idle_Time_Limit',
			});
			await this.add('Accounts_Default_User_Preferences_desktopNotificationRequireInteraction', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Notification_RequireInteraction',
				i18nDescription: 'Notification_RequireInteraction_Description',
			});
			await this.add('Accounts_Default_User_Preferences_desktopNotifications', 'all', {
				type: 'select',
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
			await this.add('Accounts_Default_User_Preferences_unreadAlert', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Unread_Tray_Icon_Alert',
			});
			await this.add('Accounts_Default_User_Preferences_useEmojis', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Use_Emojis',
			});
			await this.add('Accounts_Default_User_Preferences_convertAsciiEmoji', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Convert_Ascii_Emojis',
			});
			await this.add('Accounts_Default_User_Preferences_autoImageLoad', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Auto_Load_Images',
			});
			await this.add('Accounts_Default_User_Preferences_saveMobileBandwidth', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Save_Mobile_Bandwidth',
			});
			await this.add('Accounts_Default_User_Preferences_collapseMediaByDefault', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Collapse_Embedded_Media_By_Default',
			});
			await this.add('Accounts_Default_User_Preferences_hideUsernames', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Hide_usernames',
			});
			await this.add('Accounts_Default_User_Preferences_hideRoles', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Hide_roles',
			});
			await this.add('Accounts_Default_User_Preferences_hideFlexTab', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Hide_flextab',
			});
			await this.add('Accounts_Default_User_Preferences_displayAvatars', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Display_avatars',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarGroupByType', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Group_by_Type',
			});
			await this.add('Accounts_Default_User_Preferences_themeAppearence', 'auto', {
				type: 'select',
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
				i18nLabel: 'Theme_Appearence',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarViewMode', 'medium', {
				type: 'select',
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
				i18nLabel: 'Sidebar_list_mode',
			});
			await this.add('Accounts_Default_User_Preferences_sidebarDisplayAvatar', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Display_Avatars_Sidebar',
			});

			await this.add('Accounts_Default_User_Preferences_sidebarShowUnread', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Unread_on_top',
			});

			await this.add('Accounts_Default_User_Preferences_sidebarSortby', 'activity', {
				type: 'select',
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
				i18nLabel: 'Sort_By',
			});

			await this.add('Accounts_Default_User_Preferences_showThreadsInMainChannel', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Always_show_thread_replies_in_main_channel',
			});

			await this.add('Accounts_Default_User_Preferences_alsoSendThreadToChannel', 'default', {
				type: 'select',
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
				i18nLabel: 'Also_send_thread_message_to_channel_behavior',
			});

			await this.add('Accounts_Default_User_Preferences_sidebarShowFavorites', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Group_favorites',
			});

			await this.add('Accounts_Default_User_Preferences_sendOnEnter', 'normal', {
				type: 'select',
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
				i18nLabel: 'Enter_Behaviour',
			});
			await this.add('Accounts_Default_User_Preferences_emailNotificationMode', 'mentions', {
				type: 'select',
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
				i18nLabel: 'Email_Notification_Mode',
			});
			await this.add('Accounts_Default_User_Preferences_newRoomNotification', 'door', {
				type: 'select',
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
				i18nLabel: 'New_Room_Notification',
			});
			await this.add('Accounts_Default_User_Preferences_newMessageNotification', 'chime', {
				type: 'select',
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
				i18nLabel: 'New_Message_Notification',
			});

			await this.add('Accounts_Default_User_Preferences_muteFocusedConversations', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Mute_Focused_Conversations',
			});

			await this.add('Accounts_Default_User_Preferences_notificationsSoundVolume', 100, {
				type: 'int',
				public: true,
				i18nLabel: 'Notifications_Sound_Volume',
			});

			await this.add('Accounts_Default_User_Preferences_omnichannelTranscriptEmail', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Omnichannel_transcript_email',
			});

			await this.add('Accounts_Default_User_Preferences_notifyCalendarEvents', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Notify_Calendar_Events',
			});
		});

		await this.section('Avatar', async function () {
			await this.add('Accounts_AvatarResize', true, {
				type: 'boolean',
			});
			await this.add('Accounts_AvatarSize', 200, {
				type: 'int',
				enableQuery: {
					_id: 'Accounts_AvatarResize',
					value: true,
				},
			});

			await this.add('Accounts_AvatarExternalProviderUrl', '', {
				type: 'string',
				public: true,
			});

			await this.add('Accounts_RoomAvatarExternalProviderUrl', '', {
				type: 'string',
				public: true,
			});

			await this.add('Accounts_AvatarCacheTime', 3600, {
				type: 'int',
				i18nDescription: 'Accounts_AvatarCacheTime_description',
			});

			await this.add('Accounts_AvatarBlockUnauthenticatedAccess', false, {
				type: 'boolean',
				public: true,
			});

			return this.add('Accounts_SetDefaultAvatar', true, {
				type: 'boolean',
			});
		});

		await this.section('Password_Policy', async function () {
			await this.add('Accounts_Password_Policy_Enabled', false, {
				type: 'boolean',
			});

			const enableQuery = {
				_id: 'Accounts_Password_Policy_Enabled',
				value: true,
			};

			await this.add('Accounts_Password_Policy_MinLength', 7, {
				type: 'int',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_MaxLength', -1, {
				type: 'int',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_ForbidRepeatingCharacters', true, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_ForbidRepeatingCharactersCount', 3, {
				type: 'int',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_AtLeastOneLowercase', true, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_AtLeastOneUppercase', true, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_AtLeastOneNumber', true, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('Accounts_Password_Policy_AtLeastOneSpecialCharacter', true, {
				type: 'boolean',
				enableQuery,
			});
		});

		await this.section('Password_History', async function () {
			await this.add('Accounts_Password_History_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'Enable_Password_History',
				i18nDescription: 'Enable_Password_History_Description',
			});

			const enableQuery = {
				_id: 'Accounts_Password_History_Enabled',
				value: true,
			};

			await this.add('Accounts_Password_History_Amount', 5, {
				type: 'int',
				enableQuery,
				i18nLabel: 'Password_History_Amount',
				i18nDescription: 'Password_History_Amount_Description',
			});
		});
	});
