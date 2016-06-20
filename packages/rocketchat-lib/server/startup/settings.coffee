# Insert server unique id if it doesn't exist
RocketChat.settings.add('uniqueID', process.env.DEPLOYMENT_ID or Random.id(), { public: true, hidden: true });

# When you define a setting and want to add a description, you don't need to automatically define the i18nDescription
# if you add a node to the i18n.json with the same setting name but with `_Description` it will automatically work.
RocketChat.settings.addGroup 'Accounts', ->
	@add 'Accounts_AllowDeleteOwnAccount', false, { type: 'boolean', public: true, enableQuery: { _id: 'Accounts_AllowUserProfileChange', value: true } }
	@add 'Accounts_AllowUserProfileChange', true, { type: 'boolean', public: true }
	@add 'Accounts_AllowUserAvatarChange', true, { type: 'boolean', public: true }
	@add 'Accounts_AllowUsernameChange', true, { type: 'boolean', public: true }
	@add 'Accounts_AllowEmailChange', true, { type: 'boolean', public: true }
	@add 'Accounts_AllowPasswordChange', true, { type: 'boolean', public: true }
	@add 'Accounts_RequireNameForSignUp', true, { type: 'boolean', public: true }
	@add 'Accounts_LoginExpiration', 90, { type: 'int', public: true }
	@add 'Accounts_ShowFormLogin', true, { type: 'boolean', public: true }
	@add 'Accounts_EmailOrUsernamePlaceholder', '', { type: 'string', public: true, i18nLabel: 'Placeholder_for_email_or_username_login_field' }
	@add 'Accounts_PasswordPlaceholder', '', { type: 'string', public: true, i18nLabel: 'Placeholder_for_password_login_field' }

	@section 'Registration', ->
		@add 'Accounts_EmailVerification', false, { type: 'boolean', public: true, enableQuery: {_id: 'SMTP_Host', value: { $exists: 1, $ne: "" } } }
		@add 'Accounts_ManuallyApproveNewUsers', false, { type: 'boolean' }
		@add 'Accounts_AllowedDomainsList', '', { type: 'string', public: true }

		@add 'Accounts_BlockedDomainsList', '', { type: 'string' }
		@add 'Accounts_BlockedUsernameList', '', { type: 'string' }
		@add 'Accounts_UseDefaultBlockedDomainsList', true, { type: 'boolean' }
		@add 'Accounts_UseDNSDomainCheck', true, { type: 'boolean' }

		@add 'Accounts_RegistrationForm', 'Public', { type: 'select', public: true, values: [ { key: 'Public', i18nLabel: 'Accounts_RegistrationForm_Public' }, { key: 'Disabled', i18nLabel: 'Accounts_RegistrationForm_Disabled' }, { key: 'Secret URL', i18nLabel: 'Accounts_RegistrationForm_Secret_URL' } ] }
		@add 'Accounts_RegistrationForm_SecretURL', Random.id(), { type: 'string' }
		@add 'Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', { type: 'string', public: true }
		@add 'Accounts_Registration_AuthenticationServices_Enabled', true, { type: 'boolean', public: true }
		@add 'Accounts_PasswordReset', true, { type: 'boolean', public: true }

	@section 'Avatar', ->
		@add 'Accounts_AvatarResize', true, { type: 'boolean' }
		@add 'Accounts_AvatarSize', 200, { type: 'int', enableQuery: {_id: 'Accounts_AvatarResize', value: true} }
		@add 'Accounts_AvatarStoreType', 'GridFS', { type: 'select', values: [ { key: 'GridFS', i18nLabel: 'GridFS' }, { key: 'FileSystem', i18nLabel: 'FileSystem' } ] }
		@add 'Accounts_AvatarStorePath', '', { type: 'string', enableQuery: {_id: 'Accounts_AvatarStoreType', value: 'FileSystem'} }

RocketChat.settings.addGroup 'OAuth', ->

	@section 'Facebook', ->
		enableQuery = { _id: 'Accounts_OAuth_Facebook', value: true }
		@add 'Accounts_OAuth_Facebook', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Facebook_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Facebook_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Facebook_callback_url', '_oauth/facebook', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

	@section 'Google', ->
		enableQuery = { _id: 'Accounts_OAuth_Google', value: true }
		@add 'Accounts_OAuth_Google', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Google_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Google_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Google_callback_url', '_oauth/google', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

	@section 'GitHub', ->
		enableQuery = { _id: 'Accounts_OAuth_Github', value: true }
		@add 'Accounts_OAuth_Github', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Github_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Github_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Github_callback_url', '_oauth/github', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

	@section 'Linkedin', ->
		enableQuery = { _id: 'Accounts_OAuth_Linkedin', value: true }
		@add 'Accounts_OAuth_Linkedin', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Linkedin_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Linkedin_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Linkedin_callback_url', '_oauth/linkedin', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

	@section 'Meteor', ->
		enableQuery = { _id: 'Accounts_OAuth_Meteor', value: true }
		@add 'Accounts_OAuth_Meteor', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Meteor_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Meteor_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Meteor_callback_url', '_oauth/meteor', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

	@section 'Twitter', ->
		enableQuery = { _id: 'Accounts_OAuth_Twitter', value: true }
		@add 'Accounts_OAuth_Twitter', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Twitter_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Twitter_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Twitter_callback_url', '_oauth/twitter', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }


RocketChat.settings.addGroup 'General', ->

	@add 'Site_Url', __meteor_runtime_config__?.ROOT_URL, { type: 'string', i18nDescription: 'Site_Url_Description', public: true }
	@add 'Site_Name', 'Rocket.Chat', { type: 'string', public: true }
	@add 'Language', '', { type: 'language', public: true }
	@add 'Allow_Invalid_SelfSigned_Certs', false, { type: 'boolean' }
	@add 'Favorite_Rooms', true, { type: 'boolean', public: true }
	@add 'CDN_PREFIX', '', { type: 'string' }
	@add 'Force_SSL', false, { type: 'boolean', public: true }
	@add 'GoogleTagManager_id', '', { type: 'string', public: true }
	@add 'GoogleSiteVerification_id', '', { type: 'string', public: false }
	@add 'Restart', 'restart_server', { type: 'action', actionText: 'Restart_the_server' }

	@section 'UTF8', ->
		@add 'UTF8_Names_Validation', '[0-9a-zA-Z-_.]+', { type: 'string', public: true, i18nDescription: 'UTF8_Names_Validation_Description'}
		@add 'UTF8_Names_Slugify', true, { type: 'boolean', public: true }

	@section 'Reporting', ->
		@add 'Statistics_reporting', true, { type: 'boolean' }

	@section 'Notifications', ->
		@add 'Desktop_Notifications_Duration', 0, { type: 'int', public: true, i18nDescription: 'Desktop_Notification_Durations_Description' }

	@section 'REST API', ->
		@add 'API_User_Limit', 500, { type: 'int', public: true, i18nDescription: 'API_User_Limit' }


RocketChat.settings.addGroup 'Email', ->
	@section 'Header and Footer', ->
		@add 'Email_Header', '<table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f3f3f3" style="color:#4a4a4a;font-family: Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;border-collapse:callapse;border-spacing:0;margin:0 auto"><tr><td style="padding:1em"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="width:100%;margin:0 auto;max-width:800px"><tr><td bgcolor="#ffffff" style="background-color:#ffffff; border: 1px solid #DDD; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="background-color: #04436a;"><h1 style="font-family: Helvetica,Arial,sans-serif; padding: 0 1em; margin: 0; line-height: 70px; color: #FFF;">[Site_Name]</h1></td></tr><tr><td style="padding: 1em; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;">', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Header'
		}
		@add 'Email_Footer', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer'
		}

	@section 'SMTP', ->
		@add 'SMTP_Host', '', { type: 'string', env: true, i18nLabel: 'Host' }
		@add 'SMTP_Port', '', { type: 'string', env: true, i18nLabel: 'Port' }
		@add 'SMTP_Username', '', { type: 'string', env: true, i18nLabel: 'Username' }
		@add 'SMTP_Password', '', { type: 'password', env: true, i18nLabel: 'Password' }
		@add 'From_Email', '', { type: 'string', placeholder: 'email@domain' }
		@add 'SMTP_Test_Button', 'sendSMTPTestEmail', { type: 'action', actionText: 'Send_a_test_mail_to_my_user' }

	@section 'Invitation', ->
		@add 'Invitation_Customized', false, { type: 'boolean', i18nLabel: 'Custom' }
		@add 'Invitation_Subject', '', { type: 'string', i18nLabel: 'Subject', enableQuery: { _id: 'Invitation_Customized', value: true }, i18nDefaultQuery: { _id: 'Invitation_Customized', value: false } }
		@add 'Invitation_HTML', '', { type: 'code', code: 'text/html', multiline: true, i18nLabel: 'Body', i18nDescription: 'Invitation_HTML_Description', enableQuery: { _id: 'Invitation_Customized', value: true }, i18nDefaultQuery: { _id: 'Invitation_Customized', value: false } }

	@section 'Registration', ->
		@add 'Accounts_Enrollment_Customized', false, { type: 'boolean', i18nLabel: 'Custom' }
		@add 'Accounts_Enrollment_Email_Subject', '', { type: 'string', i18nLabel: 'Subject', enableQuery: { _id: 'Accounts_Enrollment_Customized', value: true }, i18nDefaultQuery: { _id: 'Accounts_Enrollment_Customized', value: false } }
		@add 'Accounts_Enrollment_Email', '', { type: 'code', code: 'text/html', multiline: true, i18nLabel: 'Body', enableQuery: { _id: 'Accounts_Enrollment_Customized', value: true }, i18nDefaultQuery: { _id: 'Accounts_Enrollment_Customized', value: false } }

	@section 'Registration via Admin', ->
		@add 'Accounts_UserAddedEmail_Customized', false, { type: 'boolean', i18nLabel: 'Custom' }
		@add 'Accounts_UserAddedEmailSubject', '', { type: 'string', i18nLabel: "Subject", enableQuery: { _id: 'Accounts_UserAddedEmail_Customized', value: true }, i18nDefaultQuery: { _id: 'Accounts_UserAddedEmail_Customized', value: false } }
		@add 'Accounts_UserAddedEmail', '', { type: 'code', code: 'text/html', multiline: true, i18nLabel: 'Body', i18nDescription: 'Accounts_UserAddedEmail_Description', enableQuery: { _id: 'Accounts_UserAddedEmail_Customized', value: true }, i18nDefaultQuery: { _id: 'Accounts_UserAddedEmail_Customized', value: false } }


RocketChat.settings.addGroup 'Message', ->
	@add 'Message_AllowEditing', true, { type: 'boolean', public: true }
	@add 'Message_AllowEditing_BlockEditInMinutes', 0, { type: 'int', public: true, i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription' }
	@add 'Message_AllowDeleting', true, { type: 'boolean', public: true }
	@add 'Message_AllowDeleting_BlockDeleteInMinutes', 0, { type: 'int', public: true, i18nDescription: 'Message_AllowDeleting_BlockDeleteInMinutes' }
	@add 'Message_AllowPinning', true, { type: 'boolean', public: true }
	@add 'Message_AlwaysSearchRegExp', false, { type: 'boolean' }
	@add 'Message_ShowEditedStatus', true, { type: 'boolean', public: true }
	@add 'Message_ShowDeletedStatus', false, { type: 'boolean', public: true }
	@add 'Message_AllowBadWordsFilter', false, { type: 'boolean', public: true}
	@add 'Message_BadWordsFilterList', '', {type: 'string', public: true}
	@add 'Message_KeepHistory', false, { type: 'boolean', public: true }
	@add 'Message_MaxAll', 0, { type: 'int', public: true }
	@add 'Message_MaxAllowedSize', 5000, { type: 'int', public: true }
	@add 'Message_ShowFormattingTips', true, { type: 'boolean', public: true }
	@add 'Message_AudioRecorderEnabled', true, { type: 'boolean', public: true, i18nDescription: 'Message_AudioRecorderEnabledDescription' }
	@add 'Message_GroupingPeriod', 300, { type: 'int', public: true, i18nDescription: 'Message_GroupingPeriodDescription' }
	@add 'API_Embed', true, { type: 'boolean', public: true }
	@add 'API_EmbedDisabledFor', '', { type: 'string', public: true, i18nDescription: 'API_EmbedDisabledFor_Description' }
	@add 'API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', { type: 'string', i18nDescription: 'API_EmbedIgnoredHosts_Description' }
	@add 'API_EmbedSafePorts', '80, 443', { type: 'string' }
	@add 'Message_TimeFormat', 'LT', { type: 'string', public: true, i18nDescription: 'Message_TimeFormat_Description' }
	@add 'Message_DateFormat', 'LL', { type: 'string', public: true, i18nDescription: 'Message_DateFormat_Description' }


RocketChat.settings.addGroup 'Meta', ->
	@add 'Meta_language', '', { type: 'string' }
	@add 'Meta_fb_app_id', '', { type: 'string' }
	@add 'Meta_robots', '', { type: 'string' }
	@add 'Meta_google-site-verification', '', { type: 'string' }
	@add 'Meta_msvalidate01', '', { type: 'string' }


RocketChat.settings.addGroup 'Push', ->
	@add 'Push_debug', false, { type: 'boolean', public: true }
	@add 'Push_enable', true, { type: 'boolean', public: true }
	@add 'Push_enable_gateway', true, { type: 'boolean' }
	@add 'Push_gateway', 'https://rocket.chat', { type: 'string' }
	@add 'Push_production', true, { type: 'boolean', public: true }
	@add 'Push_test_push', 'push_test', { type: 'action', actionText: 'Send_a_test_push_to_my_user' }

	@section 'Certificates_and_Keys', ->
		@add 'Push_apn_passphrase', '', { type: 'string' }
		@add 'Push_apn_key', '', { type: 'string', multiline: true }
		@add 'Push_apn_cert', '', { type: 'string', multiline: true }
		@add 'Push_apn_dev_passphrase', '', { type: 'string' }
		@add 'Push_apn_dev_key', '', { type: 'string', multiline: true }
		@add 'Push_apn_dev_cert', '', { type: 'string', multiline: true }
		@add 'Push_gcm_api_key', '', { type: 'string' }
		@add 'Push_gcm_project_number', '', { type: 'string', public: true }

	@section 'Privacy', ->
		@add 'Push_show_username_room', true, { type: 'boolean', public: true }
		@add 'Push_show_message', true, { type: 'boolean', public: true }


RocketChat.settings.addGroup 'Layout', ->

	@section 'Content', ->
		@add 'Layout_Home_Title', 'Home', { type: 'string', public: true }
		@add 'Layout_Home_Body', 'Welcome to Rocket.Chat <br> Go to APP SETTINGS -> Layout to customize this intro.', { type: 'code', code: 'text/html', multiline: true, public: true }
		@add 'Layout_Terms_of_Service', 'Terms of Service <br> Go to APP SETTINGS -> Layout to customize this page.', { type: 'code', code: 'text/html', multiline: true, public: true }
		@add 'Layout_Login_Terms', 'By proceeding you are agreeing to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>.', { type: 'string', multiline: true, public: true }
		@add 'Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', { type: 'code', code: 'text/html', multiline: true, public: true }
		@add 'Layout_Sidenav_Footer', '<img style="left: 10px; position: absolute;" src="/assets/logo.png" />', { type: 'code', code: 'text/html', public: true, i18nDescription: 'Layout_Sidenav_Footer_description' }

	@section 'Custom Scripts', ->
		@add 'Custom_Script_Logged_Out', '//Add your script', { type: 'code', multiline: true, public: true }
		@add 'Custom_Script_Logged_In', '//Add your script', { type: 'code', multiline: true, public: true }

	@section 'User Interface', ->
		@add 'UI_DisplayRoles', true, { type: 'boolean', public: true }


RocketChat.settings.addGroup 'Logs', ->
	@add 'Log_Level', '0', { type: 'select', values: [ { key: '0', i18nLabel: '0_Errors_Only' }, { key: '1', i18nLabel: '1_Errors_and_Information' }, { key: '2', i18nLabel: '2_Erros_Information_and_Debug' } ] , public: true }
	@add 'Log_Package', false, { type: 'boolean', public: true }
	@add 'Log_File', false, { type: 'boolean', public: true }
	@add 'Log_View_Limit', 1000, { type: 'int' }


RocketChat.settings.init()

# Remove runtime settings (non-persistent)
Meteor.startup ->
	RocketChat.models.Settings.update({ ts: { $lt: RocketChat.settings.ts }, persistent: { $ne: true } }, { $set: { hidden: true } }, { multi: true })
