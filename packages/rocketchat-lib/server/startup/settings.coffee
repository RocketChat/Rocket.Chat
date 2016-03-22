# Insert server unique id if it doesn't exist
if not RocketChat.models.Settings.findOneById 'uniqueID'
	RocketChat.models.Settings.createWithIdAndValue 'uniqueID', process.env.DEPLOYMENT_ID or Random.id()

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
		@add 'Accounts_OAuth_Facebook', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Facebook_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Facebook', value: true} }
		@add 'Accounts_OAuth_Facebook_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Facebook', value: true} }
		@add 'Accounts_OAuth_Facebook_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/facebook', { type: 'string', blocked: true }

	@section 'Google', ->
		@add 'Accounts_OAuth_Google', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Google_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Google', value: true} }
		@add 'Accounts_OAuth_Google_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Google', value: true} }
		@add 'Accounts_OAuth_Google_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/google', { type: 'string', blocked: true }

	@section 'GitHub', ->
		@add 'Accounts_OAuth_Github', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Github_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Github', value: true} }
		@add 'Accounts_OAuth_Github_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Github', value: true} }
		@add 'Accounts_OAuth_Github_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/github', { type: 'string', blocked: true }

	@section 'Linkedin', ->
		@add 'Accounts_OAuth_Linkedin', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Linkedin_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Linkedin', value: true} }
		@add 'Accounts_OAuth_Linkedin_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Linkedin', value: true} }
		@add 'Accounts_OAuth_Linkedin_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/linkedin', { type: 'string', blocked: true }

	@section 'Meteor', ->
		@add 'Accounts_OAuth_Meteor', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Meteor_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Meteor', value: true} }
		@add 'Accounts_OAuth_Meteor_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Meteor', value: true} }
		@add 'Accounts_OAuth_Meteor_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/meteor', { type: 'string', blocked: true }

	@section 'Twitter', ->
		@add 'Accounts_OAuth_Twitter', false, { type: 'boolean', public: true }
		@add 'Accounts_OAuth_Twitter_id', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Twitter', value: true} }
		@add 'Accounts_OAuth_Twitter_secret', '', { type: 'string', enableQuery: {_id: 'Accounts_OAuth_Twitter', value: true} }
		@add 'Accounts_OAuth_Twitter_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/twitter', { type: 'string', blocked: true }


RocketChat.settings.addGroup 'General', ->

	@add 'Site_Url', __meteor_runtime_config__?.ROOT_URL, { type: 'string', i18nDescription: 'Site_Url_Description', public: true }
	@add 'Site_Name', 'Rocket.Chat', { type: 'string', public: true }
	@add 'Language', '', { type: 'language', public: true }
	@add 'Allow_Invalid_SelfSigned_Certs', false, { type: 'boolean' }
	@add 'Disable_Favorite_Rooms', false, { type: 'boolean' }
	@add 'CDN_PREFIX', '', { type: 'string' }
	@add 'Force_SSL', false, { type: 'boolean', public: true }
	@add 'GoogleTagManager_id', '', { type: 'string', public: true }
	@add 'Restart', 'restart_server', { type: 'action', actionText: 'Restart_the_server' }

	@section 'UTF8', ->
		@add 'UTF8_Names_Validation', '[0-9a-zA-Z-_.]+', { type: 'string', public: true, i18nDescription: 'UTF8_Names_Validation_Description'}
		@add 'UTF8_Names_Slugify', true, { type: 'boolean', public: true }

	@section 'Reporting', ->
		@add 'Statistics_opt_out', false, { type: 'boolean', i18nLabel: "Opt_out_statistics" }


RocketChat.settings.addGroup 'SMTP', ->
	@add 'SMTP_Host', '', { type: 'string', env: true }
	@add 'SMTP_Port', '', { type: 'string', env: true }
	@add 'SMTP_Username', '', { type: 'string', env: true }
	@add 'SMTP_Password', '', { type: 'password', env: true }
	@add 'From_Email', '', { type: 'string', placeholder: 'email@domain' }
	@add 'SMTP_Test_Button', 'sendSMTPTestEmail', { type: 'action', actionText: 'Send_a_test_mail_to_my_user' }

	@section 'Invitation', ->
		@add 'Invitation_Subject', 'You have been invited to Rocket.Chat', { type: 'string' }
		@add 'Invitation_HTML', '<h2>You have been invited to <h1>Rocket.Chat</h1></h2><p>Go to ' + __meteor_runtime_config__?.ROOT_URL + ' and try the best open source chat solution available today!</p>', { type: 'string', multiline: true }
		@add 'Accounts_Enrollment_Email',  '', { type: 'string', multiline: true }


RocketChat.settings.addGroup 'Message', ->
	@add 'Message_AllowEditing', true, { type: 'boolean', public: true }
	@add 'Message_AllowEditing_BlockEditInMinutes', 0, { type: 'int', public: true, i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription' }
	@add 'Message_AllowDeleting', true, { type: 'boolean', public: true }
	@add 'Message_AllowPinning', true, { type: 'boolean', public: true }
	@add 'Message_ShowEditedStatus', true, { type: 'boolean', public: true }
	@add 'Message_ShowDeletedStatus', false, { type: 'boolean', public: true }
	@add 'Message_KeepHistory', false, { type: 'boolean', public: true }
	@add 'Message_MaxAllowedSize', 5000, { type: 'int', public: true }
	@add 'Message_ShowFormattingTips', true, { type: 'boolean', public: true }
	@add 'Message_AudioRecorderEnabled', true, { type: 'boolean', public: true, i18nDescription: 'Message_AudioRecorderEnabledDescription' }
	@add 'Message_GroupingPeriod', 300, { type: 'int', public: true, i18nDescription: 'Message_GroupingPeriodDescription' }
	@add 'API_Embed', true, { type: 'boolean', public: true }
	@add 'API_EmbedDisabledFor', '', { type: 'string', public: true, i18nDescription: 'API_EmbedDisabledFor_Description' }


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
		@add 'Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', { type: 'code', code: 'text/html', multiline: true, public: true }
		@add 'Layout_Sidenav_Footer', '<div><a href="https://github.com/RocketChat/Rocket.Chat" class="logo" target="_blank"> <img src="/images/logo/logo.svg?v=3" /></a><div class="github-tagline"><span class="octicon octicon-pencil" style="color: #994C00"></span> with <span class="octicon octicon-heart" style="color: red"></span> on <span class="octicon octicon-mark-github"></span></div></div>', { type: 'code', code: 'text/html', public: true, i18nDescription: 'Layout_Sidenav_Footer_description' }

	@section 'Custom Scripts', ->
		@add 'Custom_Script_Logged_Out', '//Add your script', { type: 'code', multiline: true, public: true }
		@add 'Custom_Script_Logged_In', '//Add your script', { type: 'code', multiline: true, public: true }

	@section 'Login', ->
		@add 'Layout_Login_Header', '<a class="logo" href="/"><img src="/assets/logo?v=3" /></a>', { type: 'code', code: 'text/html', multiline: true, public: true }
		@add 'Layout_Login_Terms', 'By proceeding to create your account and use Rocket.Chat, you are agreeing to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, you cannot use Rocket.Chat.', { type: 'string', multiline: true, public: true }


RocketChat.settings.addGroup 'Logs', ->
	@add 'Debug_Level', 'error', { type: 'select', values: [ { key: 'error', i18nLabel: 'Only_errors' }, { key: 'debug', i18nLabel: 'All_logs' } ] }
	@add 'Log_Level', '0', { type: 'select', values: [ { key: '0', i18nLabel: '0_Errors_Only' }, { key: '1', i18nLabel: '1_Errors_and_Information' }, { key: '2', i18nLabel: '2_Erros_Information_and_Debug' } ] , public: true }
	@add 'Log_Package', false, { type: 'boolean', public: true }
	@add 'Log_File', false, { type: 'boolean', public: true }
	@add 'Log_View_Limit', 1000, { type: 'int' }


RocketChat.settings.init()

# Remove runtime settings (non-persistent)
Meteor.startup ->
	RocketChat.models.Settings.update({ ts: { $lt: RocketChat.settings.ts }, persistent: { $ne: true } }, { $set: { hidden: true } }, { multi: true })
