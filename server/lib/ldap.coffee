Meteor.startup ->
	if RocketChat.settings.get 'LDAP_Url'
		LDAP_DEFAULTS.url = RocketChat.settings.get 'LDAP_Url'
		LDAP_DEFAULTS.port = RocketChat.settings.get 'LDAP_Port' if RocketChat.settings.get 'LDAP_Port'
		LDAP_DEFAULTS.dn = RocketChat.settings.get 'LDAP_DN' or false