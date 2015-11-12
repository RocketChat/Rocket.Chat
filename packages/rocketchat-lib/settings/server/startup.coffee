# Insert server unique id if it doesn't exist
if not RocketChat.models.Settings.findOneById 'uniqueID'
	RocketChat.models.Settings.createWithIdAndValue 'uniqueID', Random.id()

RocketChat.settings.addGroup 'Accounts'
RocketChat.settings.add 'Accounts_RegistrationRequired', true, { type: 'boolean', group: 'Accounts', public: true, section: 'Registration' }
RocketChat.settings.add 'Accounts_EmailVerification', false, { type: 'boolean', group: 'Accounts', public: true, section: 'Registration' }
RocketChat.settings.add 'Accounts_ManuallyApproveNewUsers', false, { type: 'boolean', group: 'Accounts', section: 'Registration' }
RocketChat.settings.add 'Accounts_AllowedDomainsList', '', { type: 'string', group: 'Accounts', public: true, section: 'Registration' }

RocketChat.settings.add 'Accounts_AvatarStoreType', 'GridFS', { type: 'string', group: 'Accounts', section: 'Avatar' }
RocketChat.settings.add 'Accounts_AvatarStorePath', '/var/www/rocket.chat/uploads/avatar/', { type: 'string', group: 'Accounts', section: 'Avatar' }
RocketChat.settings.add 'Accounts_AvatarResize', false, { type: 'boolean', group: 'Accounts', section: 'Avatar' }
RocketChat.settings.add 'Accounts_AvatarSize', 200, { type: 'int', group: 'Accounts', section: 'Avatar' }

RocketChat.settings.add 'Accounts_OAuth_Facebook', false, { type: 'boolean', group: 'Accounts', section: 'Facebook', public: true }
RocketChat.settings.add 'Accounts_OAuth_Facebook_id', '', { type: 'string', group: 'Accounts', section: 'Facebook' }
RocketChat.settings.add 'Accounts_OAuth_Facebook_secret', '', { type: 'string', group: 'Accounts', section: 'Facebook' }
RocketChat.settings.add 'Accounts_OAuth_Google', false, { type: 'boolean', group: 'Accounts', section: 'Google', public: true }
RocketChat.settings.add 'Accounts_OAuth_Google_id', '', { type: 'string', group: 'Accounts', section: 'Google' }
RocketChat.settings.add 'Accounts_OAuth_Google_secret', '', { type: 'string', group: 'Accounts', section: 'Google' }
RocketChat.settings.add 'Accounts_OAuth_Github', false, { type: 'boolean', group: 'Accounts', section: 'Github', public: true }
RocketChat.settings.add 'Accounts_OAuth_Github_id', '', { type: 'string', group: 'Accounts', section: 'Github' }
RocketChat.settings.add 'Accounts_OAuth_Github_secret', '', { type: 'string', group: 'Accounts', section: 'Github' }
RocketChat.settings.add 'Accounts_OAuth_Gitlab', false, { type: 'boolean', group: 'Accounts', section: 'Gitlab', public: true }
RocketChat.settings.add 'Accounts_OAuth_Gitlab_id', '', { type: 'string', group: 'Accounts', section: 'Gitlab' }
RocketChat.settings.add 'Accounts_OAuth_Gitlab_secret', '', { type: 'string', group: 'Accounts', section: 'Gitlab' }
RocketChat.settings.add 'Accounts_OAuth_Linkedin', false, { type: 'boolean', group: 'Accounts', section: 'Linkedin', public: true }
RocketChat.settings.add 'Accounts_OAuth_Linkedin_id', '', { type: 'string', group: 'Accounts', section: 'Linkedin' }
RocketChat.settings.add 'Accounts_OAuth_Linkedin_secret', '', { type: 'string', group: 'Accounts', section: 'Linkedin' }
RocketChat.settings.add 'Accounts_OAuth_Meteor', false, { type: 'boolean', group: 'Accounts', section: 'Meteor', public: true }
RocketChat.settings.add 'Accounts_OAuth_Meteor_id', '', { type: 'string', group: 'Accounts', section: 'Meteor' }
RocketChat.settings.add 'Accounts_OAuth_Meteor_secret', '', { type: 'string', group: 'Accounts', section: 'Meteor' }
RocketChat.settings.add 'Accounts_OAuth_Twitter', false, { type: 'boolean', group: 'Accounts', section: 'Twitter', public: true }
RocketChat.settings.add 'Accounts_OAuth_Twitter_id', '', { type: 'string', group: 'Accounts', section: 'Twitter' }
RocketChat.settings.add 'Accounts_OAuth_Twitter_secret', '', { type: 'string', group: 'Accounts', section: 'Twitter' }

RocketChat.settings.add 'Accounts_AllowUserProfileChange', true, { type: 'boolean', group: 'Accounts', section: 'General', public: true }
RocketChat.settings.add 'Accounts_AllowUserAvatarChange', true, { type: 'boolean', group: 'Accounts', section: 'General', public: true }
RocketChat.settings.add 'Accounts_AllowUsernameChange', true, { type: 'boolean', group: 'Accounts', section: 'General', public: true }
RocketChat.settings.add 'Accounts_AllowPasswordChange', true, { type: 'boolean', group: 'Accounts', section: 'General', public: true }
RocketChat.settings.add 'Accounts_RequireNameForSignUp', true, { type: 'boolean', group: 'Accounts', section: 'General', public: true }

RocketChat.settings.addGroup 'FileUpload'
RocketChat.settings.add 'FileUpload_Enabled', true, { type: 'boolean', group: 'FileUpload', public: true }
RocketChat.settings.add 'FileUpload_MaxFileSize', 2097152, { type: 'int', group: 'FileUpload', public: true }
RocketChat.settings.add 'FileUpload_MediaTypeWhiteList', 'image/*, audio/*, .pdf, .doc, .txt', { type: 'string', group: 'FileUpload', public: true, i18nDescription: 'FileUpload_MediaTypeWhiteListDescription' }


RocketChat.settings.addGroup 'General'
RocketChat.settings.add 'Site_Url', __meteor_runtime_config__?.ROOT_URL, { type: 'string', group: 'General', i18nDescription: 'Site_Url_Description', public: true }
RocketChat.settings.add 'Site_Name', 'Rocket.Chat', { type: 'string', group: 'General', public: true }
RocketChat.settings.add 'Allow_Invalid_SelfSigned_Certs', false, { type: 'boolean', group: 'General' }
RocketChat.settings.add 'Disable_Favorite_Rooms', false, { type: 'boolean', group: 'General' }
RocketChat.settings.add 'CDN_PREFIX', '', { type: 'string', group: 'General' }

RocketChat.settings.addGroup 'API'
RocketChat.settings.add 'API_Analytics', '', { type: 'string', group: 'API', public: true }
RocketChat.settings.add 'API_Embed', true, { type: 'boolean', group: 'API', public: true }
RocketChat.settings.add 'API_EmbedDisabledFor', '', { type: 'string', group: 'API', public: true, i18nDescription: 'API_EmbedDisabledFor_Description' }

RocketChat.settings.addGroup 'SMTP'
RocketChat.settings.add 'SMTP_Host', '', { type: 'string', group: 'SMTP' }
RocketChat.settings.add 'SMTP_Port', '', { type: 'string', group: 'SMTP' }
RocketChat.settings.add 'SMTP_Username', '', { type: 'string', group: 'SMTP' }
RocketChat.settings.add 'SMTP_Password', '', { type: 'string', group: 'SMTP' }
RocketChat.settings.add 'From_Email', '', { type: 'string', group: 'SMTP', placeholder: 'Name <email@domain>' }

RocketChat.settings.add 'Invitation_Subject', 'You have been invited to Rocket.Chat', { type: 'string', group: 'SMTP', section: 'Invitation' }
RocketChat.settings.add 'Invitation_HTML', '<h2>You have been invited to <h1>Rocket.Chat</h1></h2><p>Go to ' + __meteor_runtime_config__?.ROOT_URL + ' and try the best open source chat solution available today!</p>', { type: 'string', multiline: true, group: 'SMTP', section: 'Invitation' }

RocketChat.settings.addGroup 'Message'
RocketChat.settings.add 'Message_AllowEditing', true, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_AllowEditing_BlockEditInMinutes', 0, { type: 'int', group: 'Message', public: true, i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription' }
RocketChat.settings.add 'Message_AllowDeleting', true, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_AllowPinning', true, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_ShowEditedStatus', true, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_ShowDeletedStatus', false, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_KeepHistory', false, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_MaxAllowedSize', 5000, { type: 'int', group: 'Message', public: true }
RocketChat.settings.add 'Message_ShowFormattingTips', true, { type: 'boolean', group: 'Message', public: true }
RocketChat.settings.add 'Message_AudioRecorderEnabled', true, { type: 'boolean', group: 'Message', public: true, i18nDescription: 'Message_AudioRecorderEnabledDescription' }

RocketChat.settings.addGroup 'Meta'
RocketChat.settings.add 'Meta_language', '', { type: 'string', group: 'Meta' }
RocketChat.settings.add 'Meta_fb_app_id', '', { type: 'string', group: 'Meta' }
RocketChat.settings.add 'Meta_robots', '', { type: 'string', group: 'Meta' }
RocketChat.settings.add 'Meta_google-site-verification', '', { type: 'string', group: 'Meta' }
RocketChat.settings.add 'Meta_msvalidate01', '', { type: 'string', group: 'Meta' }

RocketChat.settings.addGroup 'Push'
RocketChat.settings.add 'Push_debug', false, { type: 'boolean', group: 'Push', public: true }
RocketChat.settings.add 'Push_enable', false, { type: 'boolean', group: 'Push', public: true }
RocketChat.settings.add 'Push_production', false, { type: 'boolean', group: 'Push', public: true }
RocketChat.settings.add 'Push_apn_passphrase', '', { type: 'string', group: 'Push' }
RocketChat.settings.add 'Push_apn_key', '', { type: 'string', multiline: true, group: 'Push' }
RocketChat.settings.add 'Push_apn_cert', '', { type: 'string', multiline: true, group: 'Push' }
RocketChat.settings.add 'Push_apn_dev_passphrase', '', { type: 'string', group: 'Push' }
RocketChat.settings.add 'Push_apn_dev_key', '', { type: 'string', multiline: true, group: 'Push' }
RocketChat.settings.add 'Push_apn_dev_cert', '', { type: 'string', multiline: true, group: 'Push' }
RocketChat.settings.add 'Push_gcm_api_key', '', { type: 'string', group: 'Push' }
RocketChat.settings.add 'Push_gcm_project_number', '', { type: 'string', group: 'Push', public: true }

RocketChat.settings.addGroup 'Layout'
RocketChat.settings.add 'Layout_Home_Title', 'Home', { type: 'string', group: 'Layout', public: true, section: 'Content' }
RocketChat.settings.add 'Layout_Home_Body', 'Welcome to Rocket.Chat <br> Go to APP SETTINGS -> Layout to customize this intro.', { type: 'string', multiline: true, group: 'Layout', public: true, section: 'Content' }
RocketChat.settings.add 'Layout_Terms_of_Service', 'Terms of Service <br> Go to APP SETTINGS -> Layout to customize this page.', { type: 'string', multiline: true, group: 'Layout', public: true, section: 'Content' }
RocketChat.settings.add 'Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', { type: 'string', multiline: true, group: 'Layout', public: true, section: 'Content' }
RocketChat.settings.add 'Layout_Sidenav_Footer', '<div><a href="https://github.com/RocketChat/Rocket.Chat" class="logo" target="_blank"> <img src="/images/logo/logo.svg?v=3" /></a><div class="github-tagline"><span class="octicon octicon-pencil" style="color: #994C00"></span> with <span class="octicon octicon-heart" style="color: red"></span> on <span class="octicon octicon-mark-github"></span></div></div>', { type: 'string', group: 'Layout', public: true, i18nDescription: 'Layout_Sidenav_Footer_description' }
RocketChat.settings.add 'Layout_Login_Header', '<a class="logo" href="/"><img src="/images/logo/logo.svg?v=3" /></a>', { type: 'string', multiline: true, group: 'Layout', public: true, section: 'Login' }
RocketChat.settings.add 'Layout_Login_Terms', 'By proceeding to create your account and use Rocket.Chat, you are agreeing to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, you cannot use Rocket.Chat.', { type: 'string', multiline: true, group: 'Layout', public: true, section: 'Login' }

RocketChat.settings.add 'Statistics_opt_out', false, { type: 'boolean', group: false }

Meteor.startup ->
	if process?.env? and not process.env['MAIL_URL']? and RocketChat.settings.get('SMTP_Host') and RocketChat.settings.get('SMTP_Username') and RocketChat.settings.get('SMTP_Password')
		process.env['MAIL_URL'] = "smtp://" + encodeURIComponent(RocketChat.settings.get('SMTP_Username')) + ':' + encodeURIComponent(RocketChat.settings.get('SMTP_Password')) + '@' + encodeURIComponent(RocketChat.settings.get('SMTP_Host'))
		if RocketChat.settings.get('SMTP_Port')
			process.env['MAIL_URL'] += ':' + parseInt(RocketChat.settings.get('SMTP_Port'))
