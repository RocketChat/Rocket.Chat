Meteor.startup ->
	RocketChat.settings.addGroup 'Accounts'
	RocketChat.settings.add 'Accounts_RegistrationRequired', true, { type: 'boolean', group: 'Accounts', public: true }
	RocketChat.settings.add 'Accounts_EmailVerification', false, { type: 'boolean', group: 'Accounts', public: true }
	RocketChat.settings.add 'LDAP_Url', '', { type: 'string', group: 'Accounts' }
	RocketChat.settings.add 'LDAP_Port', '', { type: 'string', group: 'Accounts' }
	RocketChat.settings.add 'LDAP_DN', '', { type: 'string', group: 'Accounts', public: true }

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
