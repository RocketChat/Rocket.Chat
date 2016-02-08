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
		@add 'LDAP_Sync_User_Data', false, { type: 'boolean' , enableQuery: enableQuery }
		@add 'LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: enableQuery }

		# @add 'LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery }
		# @add 'LDAP_Default_Domain', '', { type: 'string' , enableQuery: enableQuery }
