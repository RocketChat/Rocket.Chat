import { settings } from '../../../app/settings/server';

settings.addGroup('LDAP', function() {
	const enableQuery = { _id: 'LDAP_Enable', value: true };
	const enableAuthentication = [
		enableQuery,
		{ _id: 'LDAP_Authentication', value: true },
	];
	const enterprise = true;

	this.tab('LDAP_9_Enterprise', function() {
		this.section('LDAP_Connection_Authentication', function() {
			this.add('LDAP_Authentication', false, { type: 'boolean', enableQuery, enterprise, invalidValue: false });
			this.add('LDAP_Authentication_UserDN', '', { type: 'string', enableQuery: enableAuthentication, secret: true, enterprise, invalidValue: '' });
			this.add('LDAP_Authentication_Password', '', { type: 'password', enableQuery: enableAuthentication, secret: true, enterprise, invalidValue: '' });
		});

		this.section('LDAP_DataSync_CustomFields', function() {
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
		});

		this.section('LDAP_DataSync_ActiveState', function() {
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
		});

		this.section('LDAP_DataSync_Roles', function() {
			this.add('LDAP_Sync_User_Data_Roles', false, {
				type: 'boolean',
				enableQuery,
				enterprise,
				invalidValue: false,
			});
			const syncRolesQuery = [
				enableQuery,
				{ _id: 'LDAP_Sync_User_Data_Roles', value: true },
			];
			this.add('LDAP_Sync_User_Data_Roles_AutoRemove', false, {
				type: 'boolean',
				enableQuery: syncRolesQuery,
				enterprise,
				invalidValue: false,
			});

			this.add('LDAP_Sync_User_Data_Roles_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
				type: 'string',
				enableQuery: syncRolesQuery,
				enterprise,
				invalidValue: '',
			});

			this.add('LDAP_Sync_User_Data_Roles_BaseDN', '', {
				type: 'string',
				enableQuery: syncRolesQuery,
				enterprise,
				invalidValue: '',
			});

			this.add('LDAP_Sync_User_Data_RolesMap', '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}', {
				type: 'code',
				multiline: true,
				public: false,
				code: 'application/json',
				enableQuery: syncRolesQuery,
				enterprise,
				invalidValue: '',
			});
		});

		this.section('LDAP_DataSync_Channels', function() {
			this.add('LDAP_Sync_User_Data_Channels', false, {
				type: 'boolean',
				enableQuery,
				enterprise,
				invalidValue: false,
			});

			const syncChannelsQuery = [
				enableQuery,
				{ _id: 'LDAP_Sync_User_Data_Channels', value: true },
			];

			this.add('LDAP_Sync_User_Data_Channels_Admin', 'rocket.cat', {
				type: 'string',
				enableQuery: syncChannelsQuery,
				enterprise,
				invalidValue: 'rocket.cat',
			});

			this.add('LDAP_Sync_User_Data_Channels_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
				type: 'string',
				enableQuery: syncChannelsQuery,
				enterprise,
				invalidValue: '',
			});

			this.add('LDAP_Sync_User_Data_Channels_BaseDN', '', {
				type: 'string',
				enableQuery: syncChannelsQuery,
				enterprise,
				invalidValue: '',
			});

			this.add('LDAP_Sync_User_Data_ChannelsMap', '{\n\t"employee": "general",\n\t"techsupport": [\n\t\t"helpdesk",\n\t\t"support"\n\t]\n}', {
				type: 'code',
				multiline: true,
				public: false,
				code: 'application/json',
				enableQuery: syncChannelsQuery,
				enterprise,
				invalidValue: '',
			});

			this.add('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', false, {
				type: 'boolean',
				enableQuery: syncChannelsQuery,
				enterprise,
				invalidValue: false,
			});
		});

		this.section('LDAP_DataSync_Teams', function() {
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

		this.section('LDAP_DataSync_BackgroundSync', function() {
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
	});

	// this.tab('LDAP', function() {
	// 	this.section('LDAP_44_Role_Syncing', function() {
	// 		this.add('LDAP_Enable_LDAP_Roles_To_RC_Roles', false, {
	// 			type: 'boolean',
	// 			enableQuery: { _id: 'LDAP_Enable', value: true },
	// 			enterprise: true,
	// 			invalidValue: false,
	// 			modules: [
	// 				'ldap-enterprise',
	// 			],
	// 		});
	// 		this.add('LDAP_Roles_To_Rocket_Chat_Roles', '{}', {
	// 			type: 'code',
	// 			enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 			enterprise: true,
	// 			invalidValue: '{}',
	// 			modules: [
	// 				'ldap-enterprise',
	// 			],
	// 		});
	// 		this.add('LDAP_Validate_Roles_For_Each_Login', false, {
	// 			type: 'boolean',
	// 			enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 			enterprise: true,
	// 			invalidValue: false,
	// 			modules: [
	// 				'ldap-enterprise',
	// 			],
	// 		});
	// 		this.add('LDAP_Default_Role_To_User', 'user', {
	// 			type: 'select',
	// 			values: Roles.find({ scope: 'Users' }).fetch().map((role) => ({ key: role._id, i18nLabel: role._id })),
	// 			enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 			enterprise: true,
	// 			invalidValue: 'user',
	// 			modules: [
	// 				'ldap-enterprise',
	// 			],
	// 		});
	// 		this.add('LDAP_Query_To_Get_User_Groups', '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))', {
	// 			type: 'string',
	// 			enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
	// 			enterprise: true,
	// 			invalidValue: '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))',
	// 			modules: [
	// 				'ldap-enterprise',
	// 			],
	// 		});
	// 	});

	// });
});
