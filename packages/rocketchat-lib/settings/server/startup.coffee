Meteor.startup ->
	RocketChat.settings.addGroup 'Accounts'
	RocketChat.settings.add 'Accounts_RegistrationRequired', true, { type: 'boolean', group: 'Accounts', public: true }
	RocketChat.settings.add 'Accounts_EmailVerification', false, { type: 'boolean', group: 'Accounts', public: true }

	RocketChat.settings.addGroup 'API'
	RocketChat.settings.add 'API_Analytics', '', { type: 'string', group: 'API', public: true }
	RocketChat.settings.add 'API_Embed', '', { type: 'boolean', group: 'API' }

	RocketChat.settings.addGroup 'SMTP'
	RocketChat.settings.add 'SMTP_Host', '', { type: 'string', group: 'SMTP' }
	RocketChat.settings.add 'SMTP_Port', '', { type: 'string', group: 'SMTP' }
	RocketChat.settings.add 'SMTP_Security', '', { type: 'string', group: 'SMTP' }
	RocketChat.settings.add 'SMTP_Username', '', { type: 'string', group: 'SMTP' }
	RocketChat.settings.add 'SMTP_Password', '', { type: 'string', group: 'SMTP' }

	RocketChat.settings.addGroup 'Message'
	RocketChat.settings.add 'Message_Edit', '', { type: 'string', group: 'Message' }
	RocketChat.settings.add 'Message_Delete', '', { type: 'string', group: 'Message' }
	RocketChat.settings.add 'Message_ShowEditedStatus', '', { type: 'string', group: 'Message' }
	RocketChat.settings.add 'Message_ShowDeletedStatus', '', { type: 'string', group: 'Message' }
	RocketChat.settings.add 'Message_KeepStatusHistory', '', { type: 'string', group: 'Message' }
	RocketChat.settings.add 'Message_MaxAllowedSize', 5000, { type: 'int', group: 'Message', public: true }

	RocketChat.settings.addGroup 'Meta'
	RocketChat.settings.add 'Meta_language', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta_fb_app_id', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta_robots', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta_google-site-verification', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta_msvalidate01', '', { type: 'string', group: 'Meta' }

	RocketChat.settings.addGroup 'Push'
	RocketChat.settings.add 'Push_debug', false, { type: 'boolean', group: 'Push' }
	RocketChat.settings.add 'Push_enable', false, { type: 'boolean', group: 'Push' }
	RocketChat.settings.add 'Push_production', false, { type: 'boolean', group: 'Push' }
	RocketChat.settings.add 'Push_apn_passphrase', '', { type: 'string', group: 'Push' }
	RocketChat.settings.add 'Push_apn_key', '', { type: 'string', multiline: true, group: 'Push' }
	RocketChat.settings.add 'Push_apn_cert', '', { type: 'string', multiline: true, group: 'Push' }
	RocketChat.settings.add 'Push_apn_dev_passphrase', '', { type: 'string', group: 'Push' }
	RocketChat.settings.add 'Push_apn_dev_key', '', { type: 'string', multiline: true, group: 'Push' }
	RocketChat.settings.add 'Push_apn_dev_cert', '', { type: 'string', multiline: true, group: 'Push' }
