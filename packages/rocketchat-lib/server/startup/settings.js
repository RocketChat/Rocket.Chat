// Insert server unique id if it doesn't exist
RocketChat.settings.add('uniqueID', process.env.DEPLOYMENT_ID || Random.id(), {
	'public': true,
	hidden: true
});

// When you define a setting and want to add a description, you don't need to automatically define the i18nDescription
// if you add a node to the i18n.json with the same setting name but with `_Description` it will automatically work.

RocketChat.settings.addGroup('Accounts', function() {
	this.add('Accounts_AllowAnonymousRead', false, {
		type: 'boolean',
		public: true
	});
	this.add('Accounts_AllowAnonymousWrite', false, {
		type: 'boolean',
		public: true,
		enableQuery: {
			_id: 'Accounts_AllowAnonymousRead',
			value: true
		}
	});
	this.add('Accounts_AllowDeleteOwnAccount', false, {
		type: 'boolean',
		'public': true,
		enableQuery: {
			_id: 'Accounts_AllowUserProfileChange',
			value: true
		}
	});
	this.add('Accounts_AllowUserProfileChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowUserAvatarChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowRealNameChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowUsernameChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowEmailChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_AllowPasswordChange', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_CustomFieldsToShowInUserInfo', '', {
		type: 'string',
		public: true
	});
	this.add('Accounts_LoginExpiration', 90, {
		type: 'int',
		'public': true
	});
	this.add('Accounts_ShowFormLogin', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_EmailOrUsernamePlaceholder', '', {
		type: 'string',
		'public': true,
		i18nLabel: 'Placeholder_for_email_or_username_login_field'
	});
	this.add('Accounts_PasswordPlaceholder', '', {
		type: 'string',
		'public': true,
		i18nLabel: 'Placeholder_for_password_login_field'
	});
	this.add('Accounts_ForgetUserSessionOnWindowClose', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Accounts_SearchFields', 'username, name, emails.address', {
		type: 'string',
		public: true
	});

	this.section('Registration', function() {
		this.add('Accounts_DefaultUsernamePrefixSuggestion', 'user', {
			type: 'string'
		});
		this.add('Accounts_RequireNameForSignUp', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_RequirePasswordConfirmation', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_EmailVerification', false, {
			type: 'boolean',
			'public': true,
			enableQuery: {
				_id: 'SMTP_Host',
				value: {
					$exists: 1,
					$ne: ''
				}
			}
		});
		this.add('Accounts_ManuallyApproveNewUsers', false, {
			type: 'boolean'
		});
		this.add('Accounts_AllowedDomainsList', '', {
			type: 'string',
			'public': true
		});
		this.add('Accounts_BlockedDomainsList', '', {
			type: 'string'
		});
		this.add('Accounts_BlockedUsernameList', '', {
			type: 'string'
		});
		this.add('Accounts_UseDefaultBlockedDomainsList', true, {
			type: 'boolean'
		});
		this.add('Accounts_UseDNSDomainCheck', false, {
			type: 'boolean'
		});
		this.add('Accounts_RegistrationForm', 'Public', {
			type: 'select',
			'public': true,
			values: [
				{
					key: 'Public',
					i18nLabel: 'Accounts_RegistrationForm_Public'
				}, {
					key: 'Disabled',
					i18nLabel: 'Accounts_RegistrationForm_Disabled'
				}, {
					key: 'Secret URL',
					i18nLabel: 'Accounts_RegistrationForm_Secret_URL'
				}
			]
		});
		this.add('Accounts_RegistrationForm_SecretURL', Random.id(), {
			type: 'string'
		});
		this.add('Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', {
			type: 'string',
			'public': true
		});
		this.add('Accounts_Registration_AuthenticationServices_Enabled', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_Registration_AuthenticationServices_Default_Roles', 'user', {
			type: 'string',
			enableQuery: {
				_id: 'Accounts_Registration_AuthenticationServices_Enabled',
				value: true
			}
		});
		this.add('Accounts_PasswordReset', true, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_CustomFields', '', {
			type: 'code',
			'public': true,
			i18nLabel: 'Custom_Fields'
		});
	});

	this.section('Accounts_Default_User_Preferences', function() {
		this.add('Accounts_Default_User_Preferences_enableAutoAway', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Enable_Auto_Away'
		});
		this.add('Accounts_Default_User_Preferences_idleTimeoutLimit', 300000, {
			type: 'int',
			'public': true,
			i18nLabel: 'Idle_Time_Limit'
		});
		this.add('Accounts_Default_User_Preferences_desktopNotificationDuration', 0, {
			type: 'int',
			'public': true,
			i18nLabel: 'Notification_Duration'
		});
		this.add('Accounts_Default_User_Preferences_audioNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key: 'all',
					i18nLabel: 'All_messages'
				},
				{
					key: 'mentions',
					i18nLabel: 'Mentions'
				},
				{
					key: 'nothing',
					i18nLabel: 'Nothing'
				}
			],
			public: true
		});
		this.add('Accounts_Default_User_Preferences_desktopNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key: 'all',
					i18nLabel: 'All_messages'
				},
				{
					key: 'mentions',
					i18nLabel: 'Mentions'
				},
				{
					key: 'nothing',
					i18nLabel: 'Nothing'
				}
			],
			'public': true
		});
		this.add('Accounts_Default_User_Preferences_mobileNotifications', 'mentions', {
			type: 'select',
			values: [
				{
					key : 'all',
					i18nLabel : 'All_messages'
				},
				{
					key : 'mentions',
					i18nLabel : 'Mentions'
				},
				{
					key : 'nothing',
					i18nLabel : 'Nothing'
				}
			],
			'public': true
		});
		this.add('Accounts_Default_User_Preferences_unreadAlert', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Unread_Tray_Icon_Alert'
		});
		this.add('Accounts_Default_User_Preferences_useEmojis', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Use_Emojis'
		});
		this.add('Accounts_Default_User_Preferences_convertAsciiEmoji', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Convert_Ascii_Emojis'
		});
		this.add('Accounts_Default_User_Preferences_autoImageLoad', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Auto_Load_Images'
		});
		this.add('Accounts_Default_User_Preferences_saveMobileBandwidth', true, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Save_Mobile_Bandwidth'
		});
		this.add('Accounts_Default_User_Preferences_collapseMediaByDefault', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Collapse_Embedded_Media_By_Default'
		});
		this.add('Accounts_Default_User_Preferences_hideUsernames', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_usernames'
		});
		this.add('Accounts_Default_User_Preferences_hideRoles', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_roles'
		});
		this.add('Accounts_Default_User_Preferences_hideFlexTab', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_flextab'
		});
		this.add('Accounts_Default_User_Preferences_hideAvatars', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Hide_Avatars'
		});
		this.add('Accounts_Default_User_Preferences_roomsListExhibitionMode', 'category', {
			type: 'select',
			values: [
				{
					key: 'unread',
					i18nLabel: 'Unread_Rooms_Mode'
				},
				{
					key: 'activity',
					i18nLabel: 'Sort_by_activity'
				},
				{
					key: 'category',
					i18nLabel: 'Split_by_categories'
				}
			],
			'public': true,
			i18nLabel: 'Sidebar_list_mode'
		});
		this.add('Accounts_Default_User_Preferences_mergeChannels', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'UI_Merge_Channels_Groups'
		});
		this.add('Accounts_Default_User_Preferences_sendOnEnter', 'normal', {
			type: 'select',
			values: [
				{
					key: 'normal',
					i18nLabel: 'Enter_Normal'
				},
				{
					key: 'alternative',
					i18nLabel: 'Enter_Alternative'
				},
				{
					key: 'desktop',
					i18nLabel: 'Only_On_Desktop'
				}
			],
			'public': true,
			i18nLabel: 'Enter_Behaviour'
		});
		this.add('Accounts_Default_User_Preferences_viewMode', 0, {
			type: 'select',
			values: [
				{
					key: 0,
					i18nLabel: 'Normal'
				},
				{
					key: 1,
					i18nLabel: 'Cozy'
				},
				{
					key: 2,
					i18nLabel: 'Compact'
				}
			],
			'public': true,
			i18nLabel: 'View_mode'
		});
		this.add('Accounts_Default_User_Preferences_emailNotificationMode', 'all', {
			type: 'select',
			values: [
				{
					key: 'disabled',
					i18nLabel: 'Email_Notification_Mode_Disabled'
				},
				{
					key: 'all',
					i18nLabel: 'Email_Notification_Mode_All'
				}
			],
			'public': true,
			i18nLabel: 'Email_Notification_Mode'
		});
		this.add('Accounts_Default_User_Preferences_roomCounterSidebar', false, {
			type: 'boolean',
			'public': true,
			i18nLabel: 'Show_room_counter_on_sidebar'
		});
		this.add('Accounts_Default_User_Preferences_newRoomNotification', 'door', {
			type: 'select',
			values: [
				{
					key: 'none',
					i18nLabel: 'None'
				},
				{
					key: 'door',
					i18nLabel: 'Default'
				}
			],
			'public': true,
			i18nLabel: 'New_Room_Notification'
		});
		this.add('Accounts_Default_User_Preferences_newMessageNotification', 'chime', {
			type: 'select',
			values: [
				{
					key: 'none',
					i18nLabel: 'None'
				},
				{
					key: 'chime',
					i18nLabel: 'Default'
				}
			],
			'public': true,
			i18nLabel: 'New_Message_Notification'
		});
		this.add('Accounts_Default_User_Preferences_notificationsSoundVolume', 100, {
			type: 'int',
			'public': true,
			i18nLabel: 'Notifications_Sound_Volume'
		});
	});

	this.section('Avatar', function() {
		this.add('Accounts_AvatarResize', true, {
			type: 'boolean'
		});
		this.add('Accounts_AvatarSize', 200, {
			type: 'int',
			enableQuery: {
				_id: 'Accounts_AvatarResize',
				value: true
			}
		});

		return this.add('Accounts_SetDefaultAvatar', true, {
			type: 'boolean'
		});
	});
});

RocketChat.settings.addGroup('OAuth', function() {
	this.section('Facebook', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Facebook',
			value: true
		};
		this.add('Accounts_OAuth_Facebook', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Facebook_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Facebook_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Facebook_callback_url', '_oauth/facebook', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Google', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Google',
			value: true
		};
		this.add('Accounts_OAuth_Google', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Google_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Google_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Google_callback_url', '_oauth/google', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('GitHub', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Github',
			value: true
		};
		this.add('Accounts_OAuth_Github', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Github_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Github_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Github_callback_url', '_oauth/github', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Linkedin', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Linkedin',
			value: true
		};
		this.add('Accounts_OAuth_Linkedin', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Linkedin_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Linkedin_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Linkedin_callback_url', '_oauth/linkedin', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Meteor', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Meteor',
			value: true
		};
		this.add('Accounts_OAuth_Meteor', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Meteor_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Meteor_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Meteor_callback_url', '_oauth/meteor', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	this.section('Twitter', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Twitter',
			value: true
		};
		this.add('Accounts_OAuth_Twitter', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Accounts_OAuth_Twitter_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Twitter_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Twitter_callback_url', '_oauth/twitter', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
	return this.section('Proxy', function() {
		this.add('Accounts_OAuth_Proxy_host', 'https://oauth-proxy.rocket.chat', {
			type: 'string',
			'public': true
		});
		return this.add('Accounts_OAuth_Proxy_services', '', {
			type: 'string',
			'public': true
		});
	});
});

RocketChat.settings.addGroup('General', function() {
	this.add('Site_Url', typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__ !== null ? __meteor_runtime_config__.ROOT_URL : null, {
		type: 'string',
		i18nDescription: 'Site_Url_Description',
		'public': true
	});
	this.add('Site_Name', 'Rocket.Chat', {
		type: 'string',
		'public': true
	});
	this.add('Language', '', {
		type: 'language',
		'public': true
	});
	this.add('Allow_Invalid_SelfSigned_Certs', false, {
		type: 'boolean'
	});
	this.add('Favorite_Rooms', true, {
		type: 'boolean',
		'public': true
	});
	this.add('First_Channel_After_Login', '', {
		type: 'string',
		'public': true
	});
	this.add('Unread_Count', 'user_and_group_mentions_only', {
		type: 'select',
		values: [
			{
				key: 'all_messages',
				i18nLabel: 'All_messages'
			}, {
				key: 'user_mentions_only',
				i18nLabel: 'User_mentions_only'
			}, {
				key: 'group_mentions_only',
				i18nLabel: 'Group_mentions_only'
			}, {
				key: 'user_and_group_mentions_only',
				i18nLabel: 'User_and_group_mentions_only'
			}
		],
		'public': true
	});
	this.add('Unread_Count_DM', 'all_messages', {
		type: 'select',
		values: [
			{
				key: 'all_messages',
				i18nLabel: 'All_messages'
			}, {
				key: 'mentions_only',
				i18nLabel: 'Mentions_only'
			}
		],
		'public': true
	});
	this.add('Default_away_time', 300000, {
		type: 'int',
		'public': true
	});
	this.add('CDN_PREFIX', '', {
		type: 'string',
		'public': true
	});
	this.add('Force_SSL', false, {
		type: 'boolean',
		'public': true
	});
	this.add('GoogleTagManager_id', '', {
		type: 'string',
		'public': true
	});
	this.add('Bugsnag_api_key', '', {
		type: 'string',
		'public': false
	});
	this.add('Force_Disable_OpLog_For_Cache', false, {
		type: 'boolean',
		'public': false
	});
	this.add('Restart', 'restart_server', {
		type: 'action',
		actionText: 'Restart_the_server'
	});
	this.add('Store_Last_Message', false, {
		type: 'boolean',
		public: true,
		i18nDescription: 'Store_Last_Message_Sent_per_Room'
	});
	this.section('UTF8', function() {
		this.add('UTF8_Names_Validation', '[0-9a-zA-Z-_.]+', {
			type: 'string',
			'public': true,
			i18nDescription: 'UTF8_Names_Validation_Description'
		});
		return this.add('UTF8_Names_Slugify', true, {
			type: 'boolean',
			'public': true
		});
	});
	this.section('Reporting', function() {
		return this.add('Statistics_reporting', true, {
			type: 'boolean'
		});
	});
	this.section('Notifications', function() {
		this.add('Notifications_Max_Room_Members', 100, {
			type: 'int',
			public: true,
			i18nDescription: 'Notifications_Max_Room_Members_Description'
		});

		this.add('Notifications_Always_Notify_Mobile', false, {
			type: 'boolean',
			public: true,
			i18nDescription: 'Notifications_Always_Notify_Mobile_Description'
		});
	});
	this.section('REST API', function() {
		return this.add('API_User_Limit', 500, {
			type: 'int',
			'public': true,
			i18nDescription: 'API_User_Limit'
		});
	});
	this.section('Iframe_Integration', function() {
		this.add('Iframe_Integration_send_enable', false, {
			type: 'boolean',
			'public': true
		});
		this.add('Iframe_Integration_send_target_origin', '*', {
			type: 'string',
			'public': true,
			enableQuery: {
				_id: 'Iframe_Integration_send_enable',
				value: true
			}
		});
		this.add('Iframe_Integration_receive_enable', false, {
			type: 'boolean',
			'public': true
		});
		return this.add('Iframe_Integration_receive_origin', '*', {
			type: 'string',
			'public': true,
			enableQuery: {
				_id: 'Iframe_Integration_receive_enable',
				value: true
			}
		});
	});
	this.section('Translations', function() {
		return this.add('Custom_Translations', '', {
			type: 'code',
			'public': true
		});
	});
	return this.section('Stream_Cast', function() {
		return this.add('Stream_Cast_Address', '', {
			type: 'string'
		});
	});
});

RocketChat.settings.addGroup('Email', function() {
	this.section('Subject', function() {
		this.add('Offline_DM_Email', '[[Site_Name]] You have been direct messaged by [User]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_DM_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
		this.add('Offline_Mention_Email', '[[Site_Name]] You have been mentioned by [User] in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
		return this.add('Offline_Mention_All_Email', '[User] has posted a message in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_All_Email',
			i18nDescription: 'Offline_Email_Subject_Description'
		});
	});
	this.section('Header_and_Footer', function() {
		this.add('Email_Header', '<html><table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f3f3f3" style="color:#4a4a4a;font-family: Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;border-collapse:collapse;border-spacing:0;margin:0 auto"><tr><td style="padding:1em"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="width:100%;margin:0 auto;max-width:800px"><tr><td bgcolor="#ffffff" style="background-color:#ffffff; border: 1px solid #DDD; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="background-color: #04436a;"><h1 style="font-family: Helvetica,Arial,sans-serif; padding: 0 1em; margin: 0; line-height: 70px; color: #FFF;">[Site_Name]</h1></td></tr><tr><td style="padding: 1em; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;">', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Header'
		});
		this.add('Email_Footer', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer'
		});
		return this.add('Email_Footer_Direct_Reply', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">You can directly reply to this email.<br>Do not modify previous emails in the thread.<br>Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer_Direct_Reply'
		});
	});
	this.section('Direct_Reply', function() {
		this.add('Direct_Reply_Enable', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Enable'
		});
		this.add('Direct_Reply_Debug', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Debug',
			i18nDescription: 'Direct_Reply_Debug_Description'
		});
		this.add('Direct_Reply_Protocol', 'IMAP', {
			type: 'select',
			values: [
				{
					key: 'IMAP',
					i18nLabel: 'IMAP'
				}, {
					key: 'POP',
					i18nLabel: 'POP'
				}
			],
			env: true,
			i18nLabel: 'Protocol'
		});
		this.add('Direct_Reply_Host', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Host'
		});
		this.add('Direct_Reply_Port', '143', {
			type: 'select',
			values: [
				{
					key: '143',
					i18nLabel: '143'
				}, {
					key: '993',
					i18nLabel: '993'
				}, {
					key: '110',
					i18nLabel: '110'
				}, {
					key: '995',
					i18nLabel: '995'
				}
			],
			env: true,
			i18nLabel: 'Port'
		});
		this.add('Direct_Reply_IgnoreTLS', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS'
		});
		this.add('Direct_Reply_Frequency', 5, {
			type: 'int',
			env: true,
			i18nLabel: 'Direct_Reply_Frequency',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'POP'
			}
		});
		this.add('Direct_Reply_Delete', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Delete',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'IMAP'
			}
		});
		this.add('Direct_Reply_Separator', '+', {
			type: 'select',
			values: [
				{
					key: '!',
					i18nLabel: '!'
				}, {
					key: '#',
					i18nLabel: '#'
				}, {
					key: '$',
					i18nLabel: '$'
				}, {
					key: '%',
					i18nLabel: '%'
				}, {
					key: '&',
					i18nLabel: '&'
				}, {
					key: '\'',
					i18nLabel: '\''
				}, {
					key: '*',
					i18nLabel: '*'
				}, {
					key: '+',
					i18nLabel: '+'
				}, {
					key: '-',
					i18nLabel: '-'
				}, {
					key: '/',
					i18nLabel: '/'
				}, {
					key: '=',
					i18nLabel: '='
				}, {
					key: '?',
					i18nLabel: '?'
				}, {
					key: '^',
					i18nLabel: '^'
				}, {
					key: '_',
					i18nLabel: '_'
				}, {
					key: '`',
					i18nLabel: '`'
				}, {
					key: '{',
					i18nLabel: '{'
				}, {
					key: '|',
					i18nLabel: '|'
				}, {
					key: '}',
					i18nLabel: '}'
				}, {
					key: '~',
					i18nLabel: '~'
				}
			],
			env: true,
			i18nLabel: 'Direct_Reply_Separator'
		});
		this.add('Direct_Reply_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username',
			placeholder: 'email@domain'
		});
		return this.add('Direct_Reply_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password'
		});
	});
	this.section('SMTP', function() {
		this.add('SMTP_Protocol', 'smtp', {
			type: 'select',
			values: [
				{
					key: 'smtp',
					i18nLabel: 'smtp'
				}, {
					key: 'smtps',
					i18nLabel: 'smtps'
				}
			],
			env: true,
			i18nLabel: 'Protocol'
		});
		this.add('SMTP_Host', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Host'
		});
		this.add('SMTP_Port', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Port'
		});
		this.add('SMTP_IgnoreTLS', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS',
			enableQuery: {
				_id: 'SMTP_Protocol',
				value: 'smtp'
			}
		});
		this.add('SMTP_Pool', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Pool'
		});
		this.add('SMTP_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username'
		});
		this.add('SMTP_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password'
		});
		this.add('From_Email', '', {
			type: 'string',
			placeholder: 'email@domain'
		});
		return this.add('SMTP_Test_Button', 'sendSMTPTestEmail', {
			type: 'action',
			actionText: 'Send_a_test_mail_to_my_user'
		});
	});
	this.section('Invitation', function() {
		this.add('Invitation_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Invitation_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Invitation_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Invitation_Customized',
				value: false
			}
		});
		return this.add('Invitation_HTML', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Invitation_HTML_Description',
			enableQuery: {
				_id: 'Invitation_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Invitation_Customized',
				value: false
			}
		});
	});
	this.section('Registration', function() {
		this.add('Accounts_Enrollment_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Accounts_Enrollment_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: false
			}
		});
		return this.add('Accounts_Enrollment_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			enableQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_Enrollment_Customized',
				value: false
			}
		});
	});
	this.section('Registration_via_Admin', function() {
		this.add('Accounts_UserAddedEmail_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Accounts_UserAddedEmailSubject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: false
			}
		});
		return this.add('Accounts_UserAddedEmail', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Accounts_UserAddedEmail_Description',
			enableQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Accounts_UserAddedEmail_Customized',
				value: false
			}
		});
	});
	this.section('Forgot_password_section', function() {
		this.add('Forgot_Password_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Forgot_Password_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Forgot_Password_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Forgot_Password_Customized',
				value: false
			}
		});
		return this.add('Forgot_Password_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Forgot_Password_Description',
			enableQuery: {
				_id: 'Forgot_Password_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Forgot_Password_Customized',
				value: false
			}
		});
	});
	return this.section('Verification', function() {
		this.add('Verification_Customized', false, {
			type: 'boolean',
			i18nLabel: 'Custom'
		});
		this.add('Verification_Email_Subject', '', {
			type: 'string',
			i18nLabel: 'Subject',
			enableQuery: {
				_id: 'Verification_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Verification_Customized',
				value: false
			}
		});
		return this.add('Verification_Email', '', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Verification_Description',
			enableQuery: {
				_id: 'Verification_Customized',
				value: true
			},
			i18nDefaultQuery: {
				_id: 'Verification_Customized',
				value: false
			}
		});
	});
});

RocketChat.settings.addGroup('Message', function() {
	this.section('Message_Attachments', function() {
		this.add('Message_Attachments_GroupAttach', false, {
			type: 'boolean',
			'public': true,
			i18nDescription: 'Message_Attachments_GroupAttachDescription'
		});
		this.add('Message_AudioRecorderEnabled', true, {
			type: 'boolean',
			'public': true,
			i18nDescription: 'Message_AudioRecorderEnabledDescription'
		});
	});
	this.add('Message_AllowEditing', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowEditing_BlockEditInMinutes', 0, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription'
	});
	this.add('Message_AllowDeleting', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowDeleting_BlockDeleteInMinutes', 0, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_AllowDeleting_BlockDeleteInMinutes'
	});
	this.add('Message_AllowUnrecognizedSlashCommand', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowDirectMessagesToYourself', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AlwaysSearchRegExp', false, {
		type: 'boolean'
	});
	this.add('Message_ShowEditedStatus', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_ShowDeletedStatus', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_AllowBadWordsFilter', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_BadWordsFilterList', '', {
		type: 'string',
		'public': true
	});
	this.add('Message_KeepHistory', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_MaxAll', 0, {
		type: 'int',
		'public': true
	});
	this.add('Message_MaxAllowedSize', 5000, {
		type: 'int',
		'public': true
	});
	this.add('Message_ShowFormattingTips', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_SetNameToAliasEnabled', false, {
		type: 'boolean',
		'public': false,
		i18nDescription: 'Message_SetNameToAliasEnabled_Description'
	});
	this.add('Message_GroupingPeriod', 300, {
		type: 'int',
		'public': true,
		i18nDescription: 'Message_GroupingPeriodDescription'
	});
	this.add('API_Embed', true, {
		type: 'boolean',
		'public': true
	});
	this.add('API_Embed_UserAgent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36', {
		type: 'string',
		'public': true
	});
	this.add('API_EmbedCacheExpirationDays', 30, {
		type: 'int',
		'public': false
	});
	this.add('API_Embed_clear_cache_now', 'OEmbedCacheCleanup', {
		type: 'action',
		actionText: 'clear',
		i18nLabel: 'clear_cache_now'
	});
	this.add('API_EmbedDisabledFor', '', {
		type: 'string',
		'public': true,
		i18nDescription: 'API_EmbedDisabledFor_Description'
	});
	this.add('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', {
		type: 'string',
		i18nDescription: 'API_EmbedIgnoredHosts_Description'
	});
	this.add('API_EmbedSafePorts', '80, 443', {
		type: 'string'
	});
	this.add('Message_TimeFormat', 'LT', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_TimeFormat_Description'
	});
	this.add('Message_DateFormat', 'LL', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_DateFormat_Description'
	});
	this.add('Message_TimeAndDateFormat', 'LLL', {
		type: 'string',
		'public': true,
		i18nDescription: 'Message_TimeAndDateFormat_Description'
	});
	this.add('Message_QuoteChainLimit', 2, {
		type: 'int',
		'public': true
	});
	this.add('Message_HideType_uj', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_ul', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_ru', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Message_HideType_au', false, {
		type: 'boolean',
		'public': true
	});

	return this.add('Message_HideType_mute_unmute', false, {
		type: 'boolean',
		'public': true
	});
});

RocketChat.settings.addGroup('Meta', function() {
	this.add('Meta_language', '', {
		type: 'string'
	});
	this.add('Meta_fb_app_id', '', {
		type: 'string'
	});
	this.add('Meta_robots', 'INDEX,FOLLOW', {
		type: 'string'
	});
	this.add('Meta_google-site-verification', '', {
		type: 'string'
	});
	this.add('Meta_msvalidate01', '', {
		type: 'string'
	});
	return this.add('Meta_custom', '', {
		type: 'code',
		code: 'text/html',
		multiline: true
	});
});

RocketChat.settings.addGroup('Push', function() {
	this.add('Push_enable', true, {
		type: 'boolean',
		'public': true
	});
	this.add('Push_debug', false, {
		type: 'boolean',
		'public': true,
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.add('Push_enable_gateway', true, {
		type: 'boolean',
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.add('Push_gateway', 'https://gateway.rocket.chat', {
		type: 'string',
		enableQuery: [
			{
				_id: 'Push_enable',
				value: true
			}, {
				_id: 'Push_enable_gateway',
				value: true
			}
		]
	});
	this.add('Push_production', true, {
		type: 'boolean',
		'public': true,
		enableQuery: [
			{
				_id: 'Push_enable',
				value: true
			}, {
				_id: 'Push_enable_gateway',
				value: false
			}
		]
	});
	this.add('Push_test_push', 'push_test', {
		type: 'action',
		actionText: 'Send_a_test_push_to_my_user',
		enableQuery: {
			_id: 'Push_enable',
			value: true
		}
	});
	this.section('Certificates_and_Keys', function() {
		this.add('Push_apn_passphrase', '', {
			type: 'string'
		});
		this.add('Push_apn_key', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_cert', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_dev_passphrase', '', {
			type: 'string'
		});
		this.add('Push_apn_dev_key', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_apn_dev_cert', '', {
			type: 'string',
			multiline: true
		});
		this.add('Push_gcm_api_key', '', {
			type: 'string'
		});
		return this.add('Push_gcm_project_number', '', {
			type: 'string',
			'public': true
		});
	});
	return this.section('Privacy', function() {
		this.add('Push_show_username_room', true, {
			type: 'boolean',
			'public': true
		});
		return this.add('Push_show_message', true, {
			type: 'boolean',
			'public': true
		});
	});
});

RocketChat.settings.addGroup('Layout', function() {
	this.section('Content', function() {
		this.add('Layout_Home_Title', 'Home', {
			type: 'string',
			'public': true
		});
		this.add('Layout_Home_Body', 'Welcome to Rocket.Chat <br> Go to APP SETTINGS -> Layout to customize this intro.', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		this.add('Layout_Terms_of_Service', 'Terms of Service <br> Go to APP SETTINGS -> Layout to customize this page.', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		this.add('Layout_Login_Terms', 'By proceeding you are agreeing to our <a href="terms-of-service">Terms of Service</a> and <a href="privacy-policy">Privacy Policy</a>.', {
			type: 'string',
			multiline: true,
			'public': true
		});
		this.add('Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			'public': true
		});
		return this.add('Layout_Sidenav_Footer', '<a href="/home"><img src="assets/logo"/></a>', {
			type: 'code',
			code: 'text/html',
			'public': true,
			i18nDescription: 'Layout_Sidenav_Footer_description'
		});
	});
	this.section('Custom_Scripts', function() {
		this.add('Custom_Script_Logged_Out', '//Add your script', {
			type: 'code',
			multiline: true,
			'public': true
		});
		return this.add('Custom_Script_Logged_In', '//Add your script', {
			type: 'code',
			multiline: true,
			'public': true
		});
	});
	return this.section('User_Interface', function() {
		this.add('UI_DisplayRoles', true, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Merge_Channels_Groups', true, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Use_Name_Avatar', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Use_Real_Name', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Click_Direct_Message', false, {
			type: 'boolean',
			'public': true
		});
		this.add('UI_Unread_Counter_Style', 'Different_Style_For_User_Mentions', {
			type: 'select',
			values: [
				{
					key: 'Same_Style_For_Mentions',
					i18nLabel: 'Same_Style_For_Mentions'
				}, {
					key: 'Different_Style_For_User_Mentions',
					i18nLabel: 'Different_Style_For_User_Mentions'
				}
			],
			'public': true
		});
		this.add('UI_Allow_room_names_with_special_chars', false, {
			type: 'boolean',
			public: true
		});
	});
});

RocketChat.settings.addGroup('Logs', function() {
	this.add('Log_Level', '0', {
		type: 'select',
		values: [
			{
				key: '0',
				i18nLabel: '0_Errors_Only'
			}, {
				key: '1',
				i18nLabel: '1_Errors_and_Information'
			}, {
				key: '2',
				i18nLabel: '2_Erros_Information_and_Debug'
			}
		],
		'public': true
	});
	this.add('Log_Package', false, {
		type: 'boolean',
		'public': true
	});
	this.add('Log_File', false, {
		type: 'boolean',
		'public': true
	});
	return this.add('Log_View_Limit', 1000, {
		type: 'int'
	});
});

RocketChat.settings.init();
