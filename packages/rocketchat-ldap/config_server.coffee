MeteorWrapperLdapjs = Npm.require 'ldapjs'

Meteor.startup ->
	RocketChat.settings.addGroup 'LDAP', ->
		enableQuery = {_id: 'LDAP_Enable', value: true}
		enableTLSQuery = [
			{_id: 'LDAP_Enable', value: true}
			{_id: 'LDAP_Encryption', value: 'tls'}
		]
		customBindSearchEnabledQuery = [
			{_id: 'LDAP_Enable', value: true}
			{_id: 'LDAP_Use_Custom_Domain_Search', value: true}
		]
		customBindSearchDisabledQuery = [
			{_id: 'LDAP_Enable', value: true}
			{_id: 'LDAP_Use_Custom_Domain_Search', value: false}
		]

		@add 'LDAP_Enable', false, { type: 'boolean', public: true }
		@add 'LDAP_Host', '', { type: 'string', enableQuery: enableQuery }
		@add 'LDAP_Port', '389', { type: 'string', enableQuery: enableQuery }
		@add 'LDAP_Encryption', 'plain', { type: 'select', values: [ { key: 'plain', i18nLabel: 'No_Encryption' }, { key: 'tls', i18nLabel: 'StartTLS' }, { key: 'ssl', i18nLabel: 'SSL/LDAPS' } ], enableQuery: enableQuery }
		@add 'LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery }
		@add 'LDAP_Domain_Base', '', { type: 'string', enableQuery: enableQuery }
		@add 'LDAP_Use_Custom_Domain_Search', false, { type: 'boolean' , enableQuery: enableQuery }
		@add 'LDAP_Custom_Domain_Search', '', { type: 'string' , enableQuery: customBindSearchEnabledQuery }
		@add 'LDAP_Domain_Search_User', '', { type: 'string', enableQuery: customBindSearchDisabledQuery }
		@add 'LDAP_Domain_Search_Password', '', { type: 'string', enableQuery: customBindSearchDisabledQuery }
		@add 'LDAP_Restricted_User_Groups', '', { type: 'string', enableQuery: customBindSearchDisabledQuery }
		@add 'LDAP_Domain_Search_User_ID', 'sAMAccountName', { type: 'string', enableQuery: customBindSearchDisabledQuery }
		@add 'LDAP_Domain_Search_Object_Class', 'user', { type: 'string', enableQuery: customBindSearchDisabledQuery }
		@add 'LDAP_Domain_Search_Object_Category', 'person', { type: 'string', enableQuery: customBindSearchDisabledQuery }

		# @add 'LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery }
		# @add 'LDAP_Sync_User_Data', false, { type: 'boolean' , enableQuery: enableQuery }
		# @add 'LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: enableQuery }
		# @add 'LDAP_Default_Domain', '', { type: 'string' , enableQuery: enableQuery }


timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		enable = RocketChat.models.Settings.findOne({_id: 'LDAP_Enable', value: true})

		if enable?
			console.log "Enabling LDAP".blue
			# LDAP_DEFAULTS.CACert = RocketChat.settings.get 'LDAP_CA_Cert'
			# LDAP_DEFAULTS.defaultDomain = RocketChat.settings.get 'LDAP_Default_Domain' or ''
			LDAP_DEFAULTS.Host = RocketChat.settings.get 'LDAP_Host'
			LDAP_DEFAULTS.Port = RocketChat.settings.get 'LDAP_Port'
			LDAP_DEFAULTS.Encryption = RocketChat.settings.get 'LDAP_Encryption'
			LDAP_DEFAULTS.Reject_Unauthorized = RocketChat.settings.get 'LDAP_Reject_Unauthorized'
			LDAP_DEFAULTS.Domain_Base = RocketChat.settings.get 'LDAP_Domain_Base'
			LDAP_DEFAULTS.Use_Custom_Domain_Search = RocketChat.settings.get 'LDAP_Use_Custom_Domain_Search'
			LDAP_DEFAULTS.Custom_Domain_Search = RocketChat.settings.get 'LDAP_Custom_Domain_Search'
			LDAP_DEFAULTS.Domain_Search_User = RocketChat.settings.get 'LDAP_Domain_Search_User'
			LDAP_DEFAULTS.Domain_Search_Password = RocketChat.settings.get 'LDAP_Domain_Search_Password'
			LDAP_DEFAULTS.Restricted_User_Groups = RocketChat.settings.get 'LDAP_Restricted_User_Groups'
			LDAP_DEFAULTS.Domain_Search_User_ID = RocketChat.settings.get 'LDAP_Domain_Search_User_ID'
			LDAP_DEFAULTS.Domain_Search_Object_Class = RocketChat.settings.get 'LDAP_Domain_Search_Object_Class'
			LDAP_DEFAULTS.Domain_Search_Object_Category = RocketChat.settings.get 'LDAP_Domain_Search_Object_Category'
		else
			# LDAP_DEFAULTS = {}
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
