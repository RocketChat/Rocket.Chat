MeteorWrapperLdapjs = Npm.require 'ldapjs'

Meteor.startup ->
	RocketChat.settings.addGroup 'LDAP', ->
		enableQuery = {_id: 'LDAP_Enable', value: true}
		enableTLSQuery = [
			{_id: 'LDAP_Enable', value: true}
			{_id: 'LDAP_TLS', value: true}
		]

		@add 'LDAP_Enable', false, { type: 'boolean', public: true }
		@add 'LDAP_TLS', false, { type: 'boolean', enableQuery: enableQuery }
		@add 'LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery }
		@add 'LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery }
		@add 'LDAP_Url', 'ldap://', { type: 'string' , enableQuery: enableQuery }
		@add 'LDAP_Port', '389', { type: 'string' , enableQuery: enableQuery }
		@add 'LDAP_DN', '', { type: 'string' , public: true, enableQuery: enableQuery }
		@add 'LDAP_Bind_Search', '', { type: 'string' , enableQuery: enableQuery }
		@add 'LDAP_Sync_User_Data', false, { type: 'boolean' , enableQuery: enableQuery }
		@add 'LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: enableQuery }
		@add 'LDAP_Default_Domain', '', { type: 'string' , enableQuery: enableQuery }


timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		enable = RocketChat.models.Settings.findOne({_id: 'LDAP_Enable', value: true})

		if enable?
			console.log "Enabling LDAP".blue
			LDAP_DEFAULTS.TLS = RocketChat.settings.get 'LDAP_TLS'
			LDAP_DEFAULTS.CACert = RocketChat.settings.get 'LDAP_CA_Cert'
			LDAP_DEFAULTS.rejectUnauthorized = RocketChat.settings.get 'LDAP_Reject_Unauthorized'
			LDAP_DEFAULTS.url = RocketChat.settings.get 'LDAP_Url'
			LDAP_DEFAULTS.port = RocketChat.settings.get 'LDAP_Port' if RocketChat.settings.get 'LDAP_Port'
			LDAP_DEFAULTS.dn = RocketChat.settings.get 'LDAP_DN' or false
			LDAP_DEFAULTS.bindSearch = RocketChat.settings.get 'LDAP_Bind_Search' or ''
			LDAP_DEFAULTS.defaultDomain = RocketChat.settings.get 'LDAP_Default_Domain' or ''
		else
			LDAP_DEFAULTS.TLS = undefined
			LDAP_DEFAULTS.CACert = undefined
			LDAP_DEFAULTS.rejectUnauthorized = undefined
			LDAP_DEFAULTS.url = undefined
			LDAP_DEFAULTS.port = undefined
			LDAP_DEFAULTS.dn = undefined
			LDAP_DEFAULTS.bindSearch = undefined
			LDAP_DEFAULTS.defaultDomain = undefined
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
