MeteorWrapperLdapjs = Npm.require 'ldapjs'

Meteor.startup ->
	RocketChat.settings.addGroup 'LDAP'
	RocketChat.settings.add 'LDAP_Enable', false, { type: 'boolean', group: 'LDAP', public: true }
	RocketChat.settings.add 'LDAP_Url', 'ldap://', { type: 'string' , group: 'LDAP' }
	RocketChat.settings.add 'LDAP_Port', '389', { type: 'string' , group: 'LDAP' }
	RocketChat.settings.add 'LDAP_DN', '', { type: 'string' , group: 'LDAP', i18nLabel: 'LDAP_Dn', public: true }
	RocketChat.settings.add 'LDAP_Bind_Search', '', { type: 'string' , group: 'LDAP' }
	RocketChat.settings.add 'LDAP_Sync_User_Data', false, { type: 'boolean' , group: 'LDAP' }
	RocketChat.settings.add 'LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string' , group: 'LDAP' }


timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		enable = RocketChat.models.Settings.findOne({_id: 'LDAP_Enable', value: true})

		if enable?
			console.log "Enabling LDAP".blue
			LDAP_DEFAULTS.url = RocketChat.settings.get 'LDAP_Url'
			LDAP_DEFAULTS.port = RocketChat.settings.get 'LDAP_Port' if RocketChat.settings.get 'LDAP_Port'
			LDAP_DEFAULTS.dn = RocketChat.settings.get 'LDAP_DN' or false
			LDAP_DEFAULTS.bindSearch = RocketChat.settings.get 'LDAP_Bind_Search' or ''
		else
			LDAP_DEFAULTS.url = undefined
			LDAP_DEFAULTS.port = undefined
			LDAP_DEFAULTS.dn = undefined
			LDAP_DEFAULTS.bindSearch = undefined
	, 2000

RocketChat.models.Settings.find().observe
	added: (record) ->
		if /^LDAP_.+/.test record._id
			updateServices()

	changed: (record) ->
		if /^LDAP_.+/.test record._id
			updateServices()

	removed: (record) ->
		if /^LDAP_.+/.test record._id
			updateServices()
