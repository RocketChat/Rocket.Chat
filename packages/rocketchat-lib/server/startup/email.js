RocketChat.settings.addGroup('Email', function() {
	this.section('Style', function() {

		this.add('email_style', `html, body{ font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Meiryo UI',Arial,sans-serif; }

			body {
				width: 100%;
				height: 100%;
			}

			a {
				color: #1D74F5;
				font-weight: bold;
				text-decoration: none;
				line-height: 1.8;
				padding-left: 2px;
				padding-right: 2px;
			}
			p {
				margin: 1rem 0;
			}
			.btn {
				text-decoration: none;
				color: #FFF;
				background-color: #1D74F5;
				padding: 12px 18px;
				font-weight: 500;
				font-size: 14px;
				margin-top: 8px;
				text-align: center;
				cursor: pointer;
				display: inline-block;
				border-radius: 2px;
			}

			ol, ul, div {
				list-style-position: inside;
				padding: 16px 0 ;
			}
			li {
				padding: 8px 0;
				font-weight: 600;
			}
			.wrap {
				width: 100%;
				clear: both;
			}

			h1,h2,h3,h4,h5,h6 {
				line-height: 1.1; margin:0 0 16px 0; color: #000;
			}

			h1 { font-weight: 100; font-size: 44px;}
			h2 { font-weight: 600; font-size: 30px; color: #2F343D;}
			h3 { font-weight: 100; font-size: 27px;}
			h4 { font-weight: 500; font-size: 14px; color: #2F343D;}
			h5 { font-weight: 500; font-size: 13px; line-height: 1.6; color: #2F343D}
			h6 { font-weight: 500; font-size: 10px; color: #6c727A; line-height: 1.7;}

			.container {
				display: block;
				max-width: 640px;
				margin: 0 auto; /* makes it centered */
				clear: both;
				border-radius: 2px;
			}

			.content {
				padding: 36px;
			}

			.header-content {
				padding-top: 36px;
				padding-bottom: 36px;
				padding-left: 36px;
				padding-right: 36px;
				max-width: 640px;
				margin: 0 auto;
				display: block;
			}

			.lead {
				margin-bottom: 32px;
				color: #2f343d;
				line-height: 22px;
				font-size: 14px;
			}`, {
			type: 'code',
			code: 'css',
			multiline: true,
			i18nLabel: 'Offline_Mention_Email',
			i18nDescription: 'Offline_Email_Subject_Description',
		});
	});

	this.section('Subject', function() {
		this.add('Offline_DM_Email', '[[Site_Name]] You have been direct messaged by [User]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_DM_Email',
			i18nDescription: 'Offline_Email_Subject_Description',
		});
		this.add('Offline_Mention_Email', '[[Site_Name]] You have been mentioned by [User] in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_Email',
			i18nDescription: 'Offline_Email_Subject_Description',
		});
		this.add('Offline_Mention_All_Email', '[User] has posted a message in #[Room]', {
			type: 'code',
			code: 'text',
			multiline: true,
			i18nLabel: 'Offline_Mention_All_Email',
			i18nDescription: 'Offline_Email_Subject_Description',
		});
	});
	this.section('Header_and_Footer', function() {
		this.add('Email_Header', '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http: //www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http: //www.w3.org/1999/xhtml"><head><!-- If you delete this tag, the sky will fall on your head --><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>Rocket.Chat Cloud</title></head><body bgcolor="#F7F8FA"><table bgcolor="#F7F8FA" width="100%"><tr><td><!-- HEADER --><table class="wrap" bgcolor="#F7F8FA"><tr><td class="header container"><div class="header-content"><table bgcolor="#F7F8FA" width="100%"><tr><td><img src="https://rocket.chat/images/press/logos/120x22.png" alt="Rocket.chat-logo" width="150px" /></td></tr></table></div></td></tr></table><!-- /HEADER --></td></tr><tr><td><!-- BODY --><table class="wrap"><tr><td class="container" bgcolor="#FFFFFF"><div class="content"><table><tr><td>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Header',
		});
		this.add('Email_Footer', '</td></tr></table></div></td></tr></table><!-- /BODY --></td></tr><tr style="margin: 0; padding: 0;"><td style="margin: 0; padding: 0;"><!-- FOOTER --><table class="wrap" style="margin: 0; padding: 0; width: 100%; clear: both;" width="100%"><tr style="margin: 0; padding: 0;"><td class="container" style="padding: 0; border-radius: 2px; display: block; max-width: 640px; margin: 0 auto; clear: both;"><!-- content --><div class="content" style="margin: 0; list-style-position: inside; padding: 36px;"><table width="100%" style="margin: 0; padding: 0;"><tr style="margin: 0; padding: 0;"><td align="center" style="margin: 0; padding: 0; font-size: 12px;"><a href="https: //rocket.chat/blog" style="margin: 0; padding: 0; color: #1D74F5; font-weight: bold; text-decoration: none; line-height: 1.8; padding-left: 2px; padding-right: 2px;">Blog</a> | <a href="https: //github.com/RocketChat" style="margin: 0; padding: 0; color: #1D74F5; font-weight: bold; text-decoration: none; line-height: 1.8; padding-left: 2px; padding-right: 2px;">Github</a> | <a href="https: //www.facebook.com/RocketChatApp" style="margin: 0; padding: 0; color: #1D74F5; font-weight: bold; text-decoration: none; line-height: 1.8; padding-left: 2px; padding-right: 2px;">Facebook</a> | <a href="https: //www.instagram.com/rocket.chat" style="margin: 0; padding: 0; color: #1D74F5; font-weight: bold; text-decoration: none; line-height: 1.8; padding-left: 2px; padding-right: 2px;">Instagram</a></td></tr><tr style="margin: 0; padding: 0;"><td align="center" style="margin: 0; padding: 0;"><h6 style="margin: 0; padding: 0; margin-bottom: 16px; font-weight: 500; font-size: 10px; color: #6c727A; line-height: 1.7;">© Rocket.Chat Technologies Corp.</h6><h6 style="margin: 0; padding: 0; margin-bottom: 16px; font-weight: 500; font-size: 10px; color: #6c727A; line-height: 1.7;">Made with ❤️ in 🇧🇷 🇨🇦 🇩🇪 🇮🇳 🇬🇧 🇺🇸 </h6></td></tr></table></div><!-- /content --></td></tr></table><!-- /FOOTER --></td></tr></table></body></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer',
		});
		this.add('Email_Footer_Direct_Reply', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">You can directly reply to this email.<br>Do not modify previous emails in the thread.<br>Powered by <a href="https: //rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Footer_Direct_Reply',
		});
	});
	this.section('Direct_Reply', function() {
		this.add('Direct_Reply_Enable', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Enable',
		});
		this.add('Direct_Reply_Debug', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Debug',
			i18nDescription: 'Direct_Reply_Debug_Description',
		});
		this.add('Direct_Reply_Protocol', 'IMAP', {
			type: 'select',
			values: [
				{
					key: 'IMAP',
					i18nLabel: 'IMAP',
				}, {
					key: 'POP',
					i18nLabel: 'POP',
				},
			],
			env: true,
			i18nLabel: 'Protocol',
		});
		this.add('Direct_Reply_Host', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Host',
		});
		this.add('Direct_Reply_Port', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Port',
		});
		this.add('Direct_Reply_IgnoreTLS', false, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS',
		});
		this.add('Direct_Reply_Frequency', 5, {
			type: 'int',
			env: true,
			i18nLabel: 'Direct_Reply_Frequency',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'POP',
			},
		});
		this.add('Direct_Reply_Delete', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Direct_Reply_Delete',
			enableQuery: {
				_id: 'Direct_Reply_Protocol',
				value: 'IMAP',
			},
		});
		this.add('Direct_Reply_Separator', '+', {
			type: 'select',
			values: [
				{
					key: '!',
					i18nLabel: '!',
				}, {
					key: '#',
					i18nLabel: '#',
				}, {
					key: '$',
					i18nLabel: '$',
				}, {
					key: '%',
					i18nLabel: '%',
				}, {
					key: '&',
					i18nLabel: '&',
				}, {
					key: '\'',
					i18nLabel: '\'',
				}, {
					key: '*',
					i18nLabel: '*',
				}, {
					key: '+',
					i18nLabel: '+',
				}, {
					key: '-',
					i18nLabel: '-',
				}, {
					key: '/',
					i18nLabel: '/',
				}, {
					key: '=',
					i18nLabel: '=',
				}, {
					key: '?',
					i18nLabel: '?',
				}, {
					key: '^',
					i18nLabel: '^',
				}, {
					key: '_',
					i18nLabel: '_',
				}, {
					key: '`',
					i18nLabel: '`',
				}, {
					key: '{',
					i18nLabel: '{',
				}, {
					key: '|',
					i18nLabel: '|',
				}, {
					key: '}',
					i18nLabel: '}',
				}, {
					key: '~',
					i18nLabel: '~',
				},
			],
			env: true,
			i18nLabel: 'Direct_Reply_Separator',
		});
		this.add('Direct_Reply_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username',
			placeholder: 'email@domain',
		});
		this.add('Direct_Reply_ReplyTo', '', {
			type: 'string',
			env: true,
			i18nLabel: 'ReplyTo',
			placeholder: 'email@domain',
		});
		return this.add('Direct_Reply_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password',
		});
	});
	this.section('SMTP', function() {
		this.add('SMTP_Protocol', 'smtp', {
			type: 'select',
			values: [
				{
					key: 'smtp',
					i18nLabel: 'smtp',
				}, {
					key: 'smtps',
					i18nLabel: 'smtps',
				},
			],
			env: true,
			i18nLabel: 'Protocol',
		});
		this.add('SMTP_Host', 'localhost', {
			type: 'string',
			env: true,
			i18nLabel: 'Host',
		});
		this.add('SMTP_Port', '1025', {
			type: 'string',
			env: true,
			i18nLabel: 'Port',
		});
		this.add('SMTP_IgnoreTLS', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'IgnoreTLS',
			enableQuery: {
				_id: 'SMTP_Protocol',
				value: 'smtp',
			},
		});
		this.add('SMTP_Pool', true, {
			type: 'boolean',
			env: true,
			i18nLabel: 'Pool',
		});
		this.add('SMTP_Username', '', {
			type: 'string',
			env: true,
			i18nLabel: 'Username',
			autocomplete: false,
		});
		this.add('SMTP_Password', '', {
			type: 'password',
			env: true,
			i18nLabel: 'Password',
			autocomplete: false,
		});
		this.add('From_Email', '', {
			type: 'string',
			placeholder: 'email@domain',
		});
		return this.add('SMTP_Test_Button', 'sendSMTPTestEmail', {
			type: 'action',
			actionText: 'Send_a_test_mail_to_my_user',
		});
	});

	this.section('Registration', function() {
		this.add('Accounts_Enrollment_Email_Subject', '{Welcome_to Site_name}', {
			type: 'string',
			i18nLabel: 'Subject',
		});
		this.add('Accounts_Enrollment_Email', '<h2>{Welcome_to Site_Name}</h2><p>{Visit_Site_Url_and_try_the_best_open_source_chat_solution_available_today}</p><a class="btn" target="_blank" href="[Site_URL]">{Login}</a>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
		});
	});

	this.section('Registration_via_Admin', function() {
		this.add('Accounts_UserAddedEmailSubject', '{Welcome_to Site_Name}', {
			type: 'string',
			i18nLabel: 'Subject',
		});
		this.add('Accounts_UserAddedEmail', '<h2>{Welcome_to Site_Name}</h2><p>{Visit_Site_Url_and_try_the_best_open_source_chat_solution_available_today}</p><a class="btn" target="_blank" href="[Site_URL]">{Login}</a>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Accounts_UserAddedEmail_Description',
		});
	});

	this.section('Verification', function() {
		this.add('Verification_Email_Subject', '{Verification_Email_Subject}', {
			type: 'string',
			i18nLabel: 'Subject',
		});

		this.add('Verification_Email', '<h2>{Hi_username}</h2><p>{Verification_email_body}</p><a class="btn" target="_blank" href="[Verification_Url]">{Verify_your_email}</a>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Verification_Description',
		});
	});


	this.section('Invitation', function() {
		this.add('Invitation_Subject', '{Invitation_Subject_Default}', {
			type: 'string',
			i18nLabel: 'Subject',
		});
		this.add('Invitation_HTML', '<h2>{Welcome_to Site_Name}</h2><p>Visit [Site_URL] and try the best open source chat solution available today!</p><a class="btn" href="[Site_URL]">{Join_Chat}</a>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Invitation_HTML_Description',
		});
	});

	this.section('Forgot_password_section', function() {
		this.add('Forgot_Password_Email_Subject', '{Forgot_Password_Email_Subject}', {
			type: 'string',
			i18nLabel: 'Subject',
		});

		this.add('Forgot_Password_Email', '<h2>{Forgot_password}</h2><p>{Lets_get_you_new_one}</p><a class="btn" href="[Forgot_Password_Url]">{Reset}</a>', {
			type: 'code',
			code: 'text/html',
			multiline: true,
			i18nLabel: 'Body',
			i18nDescription: 'Forgot_Password_Description',
		});
	});
});
