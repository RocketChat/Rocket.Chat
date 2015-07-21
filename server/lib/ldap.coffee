Meteor.startup ->
	if RocketChat.settings.get 'LDAP_URL'
		LDAP_DEFAULTS.url = RocketChat.settings.get 'LDAP_URL'
		LDAP_DEFAULTS.port = RocketChat.settings.get 'LDAP_PORT' if RocketChat.settings.get 'LDAP_PORT'
		LDAP_DEFAULTS.dn = RocketChat.settings.get 'LDAP_DN' or false