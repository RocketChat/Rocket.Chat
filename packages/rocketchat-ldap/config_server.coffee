MeteorWrapperLdapjs = Npm.require 'ldapjs'

Meteor.startup ->
	RocketChat.settings.addGroup 'LDAP', ->
		@add 'LDAP_Enable', false, { type: 'boolean', public: true }
		@add 'LDAP_Url', 'ldap://', { type: 'string' , enableQuery: {_id: 'LDAP_Enable', value: true} }
		@add 'LDAP_Port', '389', { type: 'string' , enableQuery: {_id: 'LDAP_Enable', value: true} }
		@add 'LDAP_DN', '', { type: 'string' , public: true, enableQuery: {_id: 'LDAP_Enable', value: true} }
		@add 'LDAP_Bind_Search', '', { type: 'string' , enableQuery: {_id: 'LDAP_Enable', value: true} }
		@add 'LDAP_Sync_User_Data', false, { type: 'boolean' , enableQuery: {_id: 'LDAP_Enable', value: true} }
		@add 'LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: {_id: 'LDAP_Enable', value: true} }


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
