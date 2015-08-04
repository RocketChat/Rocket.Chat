Meteor.startup ->
	RocketChat.settings.addGroup 'Accounts'
	RocketChat.settings.add 'Accounts_RegistrationRequired', true, { type: 'boolean', group: 'Accounts', public: true }
	RocketChat.settings.add 'Accounts_EmailVerification', false, { type: 'boolean', group: 'Accounts', public: true }

	RocketChat.settings.addGroup 'API'
	RocketChat.settings.add 'API_Analytics', '', { type: 'string', group: 'API', public: true }
	RocketChat.settings.add 'API_Piwik_URL', '', { type: 'string', group: 'API', public: true }
	RocketChat.settings.add 'API_Piwik_ID', '', { type: 'string', group: 'API', public: true }
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

	RocketChat.settings.addGroup 'Meta'
	RocketChat.settings.add 'Meta:language', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta:fb:app_id', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta:robots', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta:google-site-verification', '', { type: 'string', group: 'Meta' }
	RocketChat.settings.add 'Meta:msvalidate.01', '', { type: 'string', group: 'Meta' }
