RocketChat.settings.addGroup('LDAP', function() {
	const enableQuery = {_id: 'LDAP_Enable', value: true};
	const enableAuthentication = [
		enableQuery,
		{_id: 'LDAP_Authentication', value: true}
	];
	const enableTLSQuery = [
		enableQuery,
		{_id: 'LDAP_Encryption', value: {$in: ['tls', 'ssl']}}
	];
	const syncDataQuery = [
		enableQuery,
		{_id: 'LDAP_Sync_User_Data', value: true}
	];
	const groupFilterQuery = [
		enableQuery,
		{_id: 'LDAP_Group_Filter_Enable', value: true}
	];
	const backgroundSyncQuery = [
		enableQuery,
		{_id: 'LDAP_Background_Sync', value: true}
	];

	this.add('LDAP_Enable', false, { type: 'boolean', public: true });
	this.add('LDAP_Login_Fallback', true, { type: 'boolean', enableQuery });
	this.add('LDAP_Host', '', { type: 'string', enableQuery });
	this.add('LDAP_Port', '389', { type: 'string', enableQuery });
	this.add('LDAP_Reconnect', false, { type: 'boolean', enableQuery });
	this.add('LDAP_Encryption', 'plain', { type: 'select', values: [ { key: 'plain', i18nLabel: 'No_Encryption' }, { key: 'tls', i18nLabel: 'StartTLS' }, { key: 'ssl', i18nLabel: 'SSL/LDAPS' } ], enableQuery });
	this.add('LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery });
	this.add('LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery });
	this.add('LDAP_BaseDN', '', { type: 'string', enableQuery });
	this.add('LDAP_Internal_Log_Level', 'disabled', {
		type: 'select',
		values: [
			{ key: 'disabled', i18nLabel: 'Disabled' },
			{ key: 'error', i18nLabel: 'Error' },
			{ key: 'warn', i18nLabel: 'Warn' },
			{ key: 'info', i18nLabel: 'Info' },
			{ key: 'debug', i18nLabel: 'Debug' },
			{ key: 'trace', i18nLabel: 'Trace' }
		],
		enableQuery
	});
	this.add('LDAP_Test_Connection', 'ldap_test_connection', { type: 'action', actionText: 'Test_Connection' });

	this.section('Authentication', function() {
		this.add('LDAP_Authentication', false, { type: 'boolean', enableQuery });
		this.add('LDAP_Authentication_UserDN', '', { type: 'string', enableQuery: enableAuthentication });
		this.add('LDAP_Authentication_Password', '', { type: 'password', enableQuery: enableAuthentication });
	});

	this.section('Timeouts', function() {
		this.add('LDAP_Timeout', 60000, {type: 'int', enableQuery});
		this.add('LDAP_Connect_Timeout', 1000, {type: 'int', enableQuery});
		this.add('LDAP_Idle_Timeout', 1000, {type: 'int', enableQuery});
	});

	this.section('User Search', function() {
		this.add('LDAP_User_Search_Filter', '(objectclass=*)', { type: 'string', enableQuery });
		this.add('LDAP_User_Search_Scope', 'sub', { type: 'string', enableQuery });
		this.add('LDAP_User_Search_Field', 'sAMAccountName', { type: 'string', enableQuery });
		this.add('LDAP_Search_Page_Size', 250, { type: 'int', enableQuery });
		this.add('LDAP_Search_Size_Limit', 1000, { type: 'int', enableQuery });
	});

	this.section('User Search (Group Validation)', function() {
		this.add('LDAP_Group_Filter_Enable', false, { type: 'boolean', enableQuery });
		this.add('LDAP_Group_Filter_ObjectClass', 'groupOfUniqueNames', { type: 'string', enableQuery: groupFilterQuery });
		this.add('LDAP_Group_Filter_Group_Id_Attribute', 'cn', { type: 'string', enableQuery: groupFilterQuery });
		this.add('LDAP_Group_Filter_Group_Member_Attribute', 'uniqueMember', { type: 'string', enableQuery: groupFilterQuery });
		this.add('LDAP_Group_Filter_Group_Member_Format', 'uniqueMember', { type: 'string', enableQuery: groupFilterQuery });
		this.add('LDAP_Group_Filter_Group_Name', 'ROCKET_CHAT', { type: 'string', enableQuery: groupFilterQuery });
	});

	this.section('Sync / Import', function() {
		this.add('LDAP_Username_Field', 'sAMAccountName', { type: 'string', enableQuery });
		this.add('LDAP_Unique_Identifier_Field', 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber', { type: 'string', enableQuery });
		this.add('LDAP_Default_Domain', '', { type: 'string', enableQuery });
		this.add('LDAP_Merge_Existing_Users', false, { type: 'boolean', enableQuery });

		this.add('LDAP_Sync_User_Data', false, { type: 'boolean', enableQuery });
		this.add('LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', { type: 'string', enableQuery: syncDataQuery });
		this.add('LDAP_Sync_User_Avatar', true, { type: 'boolean', enableQuery });

		this.add('LDAP_Background_Sync', false, { type: 'boolean', enableQuery });
		this.add('LDAP_Background_Sync_Interval', 'Every 24 hours', { type: 'string', enableQuery: backgroundSyncQuery });
		this.add('LDAP_Background_Sync_Import_New_Users', true, { type: 'boolean', enableQuery: backgroundSyncQuery });
		this.add('LDAP_Background_Sync_Keep_Existant_Users_Updated', true, { type: 'boolean', enableQuery: backgroundSyncQuery });

		this.add('LDAP_Sync_Now', 'ldap_sync_now', { type: 'action', actionText: 'Execute_Synchronization_Now' });
	});
});
