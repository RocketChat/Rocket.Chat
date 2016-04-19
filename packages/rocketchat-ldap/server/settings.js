Meteor.startup(function() {
	RocketChat.settings.addGroup('LDAP', function() {
		const enableQuery = {_id: 'LDAP_Enable', value: true};
		const enableTLSQuery = [
			{_id: 'LDAP_Enable', value: true},
			{_id: 'LDAP_Encryption', value: {$in: ['tls', 'ssl']}}
		];
		const customBindSearchEnabledQuery = [
			{_id: 'LDAP_Enable', value: true},
			{_id: 'LDAP_Use_Custom_Domain_Search', value: true}
		];
		const customBindSearchDisabledQuery = [
			{_id: 'LDAP_Enable', value: true},
			{_id: 'LDAP_Use_Custom_Domain_Search', value: false}
		];
		const syncDataQuery = [
			{_id: 'LDAP_Enable', value: true},
			{_id: 'LDAP_Sync_User_Data', value: true}
		];

		this.add('LDAP_Enable', false, { type: 'boolean', public: true });
		this.add('LDAP_Host', '', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Port', '389', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Encryption', 'plain', { type: 'select', values: [ { key: 'plain', i18nLabel: 'No_Encryption' }, { key: 'tls', i18nLabel: 'StartTLS' }, { key: 'ssl', i18nLabel: 'SSL/LDAPS' } ], enableQuery: enableQuery });
		this.add('LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery });
		this.add('LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery });
		this.add('LDAP_Domain_Base', '', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Use_Custom_Domain_Search', false, { type: 'boolean', enableQuery: enableQuery });
		this.add('LDAP_Custom_Domain_Search', '', { type: 'string', enableQuery: customBindSearchEnabledQuery });
		this.add('LDAP_Domain_Search_User', '', { type: 'string', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Domain_Search_Password', '', { type: 'password', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Domain_Search_Filter', '', { type: 'string', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Domain_Search_User_ID', 'sAMAccountName', { type: 'string', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Domain_Search_Object_Class', 'user', { type: 'string', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Domain_Search_Object_Category', 'person', { type: 'string', enableQuery: customBindSearchDisabledQuery });
		this.add('LDAP_Username_Field', 'sAMAccountName', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Unique_Identifier_Field', 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Sync_User_Data', false, { type: 'boolean', enableQuery: enableQuery });
		this.add('LDAP_Sync_User_Avatar', true, { type: 'boolean', enableQuery: syncDataQuery });
		this.add('LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: syncDataQuery });
		this.add('LDAP_Default_Domain', '', { type: 'string', enableQuery: enableQuery });
		this.add('LDAP_Test_Connection', 'ldap_test_connection', { type: 'action', actionText: 'Test_Connection' });
		this.add('LDAP_Sync_Users', 'ldap_sync_users', { type: 'action', actionText: 'Sync_Users' });
	});
});
