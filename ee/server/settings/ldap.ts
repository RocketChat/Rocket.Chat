import { settings } from '../../../app/settings/server';
// import { Roles } from '../../../app/models/server';

settings.addGroup('LDAP', function() {
	const enableQuery = { _id: 'LDAP_Enable', value: true };
	const enableAuthentication = [
		enableQuery,
		{ _id: 'LDAP_Authentication', value: true },
	];
	const groupFilterQuery = [
		enableQuery,
		{ _id: 'LDAP_Group_Filter_Enable', value: true },
	];

	const enterprise = true;

	this.add('LDAP_Login_Fallback', false, { type: 'boolean', enterprise, invalidValue: true });


	this.section('LDAP_11_Authentication', function() {
		this.add('LDAP_Authentication', false, { type: 'boolean', enableQuery, enterprise, invalidValue: false });
		this.add('LDAP_Authentication_UserDN', '', { type: 'string', enableQuery: enableAuthentication, secret: true, enterprise, invalidValue: '' });
		this.add('LDAP_Authentication_Password', '', { type: 'password', enableQuery: enableAuthentication, secret: true, enterprise, invalidValue: '' });
	});

	this.section('LDAP_31_Advanced_User_Search', function() {
		this.add('LDAP_Group_Filter_Enable', false, { type: 'boolean', enableQuery, enterprise, invalidValue: false });
		this.add('LDAP_Group_Filter_ObjectClass', 'groupOfUniqueNames', { type: 'string', enableQuery: groupFilterQuery, enterprise, invalidValue: 'groupOfUniqueNames' });
		this.add('LDAP_Group_Filter_Group_Id_Attribute', 'cn', { type: 'string', enableQuery: groupFilterQuery, enterprise, invalidValue: 'cn' });
		this.add('LDAP_Group_Filter_Group_Member_Attribute', 'uniqueMember', { type: 'string', enableQuery: groupFilterQuery, enterprise, invalidValue: 'uniqueMember' });
		this.add('LDAP_Group_Filter_Group_Member_Format', 'uniqueMember', { type: 'string', enableQuery: groupFilterQuery, enterprise, invalidValue: 'uniqueMember' });
		this.add('LDAP_Group_Filter_Group_Name', 'ROCKET_CHAT', { type: 'string', enableQuery: groupFilterQuery, enterprise, invalidValue: 'ROCKET_CHAT' });
	});

	this.section('LDAP_41_Advanced_Sync', function() {
		this.add('LDAP_Sync_Custom_Fields', false, {
			type: 'boolean',
			enableQuery,
			enterprise,
			invalidValue: false,
		});

		this.add('LDAP_CustomFieldMap', '{}', {
			type: 'string',
			multiline: true,
			enableQuery: [
				enableQuery,
				{ _id: 'LDAP_Sync_Custom_Fields', value: true },
			],
			enterprise,
			invalidValue: '{}',
		});

		this.add('LDAP_Sync_User_Active_State', 'disable', {
			type: 'select',
			values: [
				{ key: 'none', i18nLabel: 'LDAP_Sync_User_Active_State_Nothing' },
				{ key: 'disable', i18nLabel: 'LDAP_Sync_User_Active_State_Disable' },
				{ key: 'both', i18nLabel: 'LDAP_Sync_User_Active_State_Both' },
			],
			i18nDescription: 'LDAP_Sync_User_Active_State_Description',
			enableQuery: { _id: 'LDAP_Enable', value: true },
			enterprise: true,
			invalidValue: 'none',
			modules: [
				'ldap-enterprise',
			],
		});

		this.add('LDAP_Sync_Now', 'ldapSyncNow', {
			type: 'action',
			actionText: 'Execute_Synchronization_Now',
			enterprise,
			invalidValue: '',
		});
	});

	this.section('LDAP_42_Background_Sync', function() {
		this.add('LDAP_Background_Sync', false, {
			type: 'boolean',
			enableQuery,
			enterprise,
			invalidValue: false,
		});

		const backgroundSyncQuery = [
			enableQuery,
			{ _id: 'LDAP_Background_Sync', value: true },
		];

		this.add('LDAP_Background_Sync_Interval', 'Every 24 hours', {
			type: 'string',
			enableQuery: backgroundSyncQuery,
			enterprise,
			invalidValue: 'Every 24 hours',
		});

		this.add('LDAP_Background_Sync_Import_New_Users', true, {
			type: 'boolean',
			enableQuery: backgroundSyncQuery,
			enterprise,
			invalidValue: true,
		});

		this.add('LDAP_Background_Sync_Keep_Existant_Users_Updated', true, {
			type: 'boolean',
			enableQuery: backgroundSyncQuery,
			enterprise,
			invalidValue: true,
		});
	});

	this.section('LDAP_43_Group_Sync', function() {
		this.add('LDAP_Sync_User_Data_Groups', false, {
			type: 'boolean',
			enableQuery,
			enterprise,
			invalidValue: false,
		});

		const syncGroupsQuery = [
			enableQuery,
			{ _id: 'LDAP_Sync_User_Data_Groups', value: true },
		];

		this.add('LDAP_Sync_User_Data_Groups_AutoRemove', false, {
			type: 'boolean',
			enableQuery: syncGroupsQuery,
			enterprise,
			invalidValue: false,
		});

		this.add('LDAP_Sync_User_Data_Groups_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
			type: 'string',
			enableQuery: syncGroupsQuery,
			enterprise,
			invalidValue: '',
		});

		this.add('LDAP_Sync_User_Data_Groups_BaseDN', '', {
			type: 'string',
			enableQuery: syncGroupsQuery,
			enterprise,
			invalidValue: '',
		});

		this.add('LDAP_Sync_User_Data_GroupsMap', '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}', {
			type: 'code',
			multiline: true,
			public: false,
			code: 'application/json',
			enableQuery: syncGroupsQuery,
			enterprise,
			invalidValue: '',
		});

		this.add('LDAP_Sync_User_Data_Groups_AutoChannels', false, {
			type: 'boolean',
			enableQuery: syncGroupsQuery,
			enterprise,
			invalidValue: false,
		});

		const syncGroupsChannelsQuery = [
			enableQuery,
			{ _id: 'LDAP_Sync_User_Data_Groups', value: true },
			{ _id: 'LDAP_Sync_User_Data_Groups_AutoChannels', value: true },
		];

		this.add('LDAP_Sync_User_Data_Groups_AutoChannels_Admin', 'rocket.cat', {
			type: 'string',
			enableQuery: syncGroupsChannelsQuery,
			enterprise,
			invalidValue: 'rocket.cat',
		});

		this.add('LDAP_Sync_User_Data_Groups_AutoChannelsMap', '{\n\t"employee": "general",\n\t"techsupport": [\n\t\t"helpdesk",\n\t\t"support"\n\t]\n}', {
			type: 'code',
			multiline: true,
			public: false,
			code: 'application/json',
			enableQuery: syncGroupsChannelsQuery,
			enterprise,
			invalidValue: '',
		});

		this.add('LDAP_Sync_User_Data_Groups_Enforce_AutoChannels', false, {
			type: 'boolean',
			enableQuery: syncGroupsChannelsQuery,
			enterprise,
			invalidValue: false,
		});
	});

	// this.section('LDAP_44_Role_Syncing', function() {
	// 	this.add('LDAP_Enable_LDAP_Roles_To_RC_Roles', false, {
	// 		type: 'boolean',
	// 		enableQuery: { _id: 'LDAP_Enable', value: true },
	// 		enterprise: true,
	// 		invalidValue: false,
	// 		modules: [
	// 			'ldap-enterprise',
	// 		],
	// 	});
	// 	this.add('LDAP_Roles_To_Rocket_Chat_Roles', '{}', {
	// 		type: 'code',
	// 		enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 		enterprise: true,
	// 		invalidValue: '{}',
	// 		modules: [
	// 			'ldap-enterprise',
	// 		],
	// 	});
	// 	this.add('LDAP_Validate_Roles_For_Each_Login', false, {
	// 		type: 'boolean',
	// 		enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 		enterprise: true,
	// 		invalidValue: false,
	// 		modules: [
	// 			'ldap-enterprise',
	// 		],
	// 	});
	// 	this.add('LDAP_Default_Role_To_User', 'user', {
	// 		type: 'select',
	// 		values: Roles.find({ scope: 'Users' }).fetch().map((role) => ({ key: role._id, i18nLabel: role._id })),
	// 		enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 		enterprise: true,
	// 		invalidValue: 'user',
	// 		modules: [
	// 			'ldap-enterprise',
	// 		],
	// 	});
	// 	this.add('LDAP_Query_To_Get_User_Groups', '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))', {
	// 		type: 'string',
	// 		enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 		enterprise: true,
	// 		invalidValue: '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))',
	// 		modules: [
	// 			'ldap-enterprise',
	// 		],
	// 	});
	// });

	this.section('LDAP_44_Team_Syncing', function() {
		this.add('LDAP_Enable_LDAP_Groups_To_RC_Teams', false, {
			type: 'boolean',
			enableQuery: { _id: 'LDAP_Enable', value: true },
			enterprise: true,
			invalidValue: false,
			modules: [
				'ldap-enterprise',
			],
		});
		this.add('LDAP_Groups_To_Rocket_Chat_Teams', '{}', {
			type: 'code',
			enableQuery: { _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: true },
			enterprise: true,
			invalidValue: '{}',
			modules: [
				'ldap-enterprise',
			],
		});
		this.add('LDAP_Validate_Teams_For_Each_Login', false, {
			type: 'boolean',
			enableQuery: { _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: true },
			enterprise: true,
			invalidValue: false,
			modules: [
				'ldap-enterprise',
			],
		});
		this.add('LDAP_Query_To_Get_User_Teams', '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))', {
			type: 'string',
			enableQuery: { _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: true },
			enterprise: true,
			invalidValue: '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))',
			modules: [
				'ldap-enterprise',
			],
		});
	});
});
