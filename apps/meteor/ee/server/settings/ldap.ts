import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	settingsRegistry.addGroup('LDAP', function () {
		const enableQuery = { _id: 'LDAP_Enable', value: true };

		this.with(
			{
				tab: 'LDAP_Enterprise',
				enterprise: true,
				modules: ['ldap-enterprise'],
			},
			function () {
				this.section('LDAP_DataSync_BackgroundSync', function () {
					this.add('LDAP_Background_Sync', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					const backgroundSyncQuery = [enableQuery, { _id: 'LDAP_Background_Sync', value: true }];

					this.add('LDAP_Background_Sync_Interval', 'Every 24 hours', {
						type: 'string',
						enableQuery: backgroundSyncQuery,
						invalidValue: 'Every 24 hours',
					});

					this.add('LDAP_Background_Sync_Import_New_Users', true, {
						type: 'boolean',
						enableQuery: backgroundSyncQuery,
						invalidValue: true,
					});

					this.add('LDAP_Background_Sync_Keep_Existant_Users_Updated', true, {
						type: 'boolean',
						enableQuery: backgroundSyncQuery,
						invalidValue: true,
					});

					this.add('LDAP_Background_Sync_Avatars', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					this.add('LDAP_Background_Sync_Avatars_Interval', 'Every 24 hours', {
						type: 'string',
						enableQuery: [enableQuery, { _id: 'LDAP_Background_Sync_Avatars', value: true }],
						invalidValue: 'Every 24 hours',
					});
				});

				this.section('LDAP_DataSync_Advanced', function () {
					this.add('LDAP_Sync_User_Active_State', 'disable', {
						type: 'select',
						values: [
							{ key: 'none', i18nLabel: 'LDAP_Sync_User_Active_State_Nothing' },
							{ key: 'disable', i18nLabel: 'LDAP_Sync_User_Active_State_Disable' },
							{ key: 'both', i18nLabel: 'LDAP_Sync_User_Active_State_Both' },
						],
						i18nDescription: 'LDAP_Sync_User_Active_State_Description',
						enableQuery: { _id: 'LDAP_Enable', value: true },
						invalidValue: 'none',
					});

					this.add('LDAP_User_Search_AttributesToQuery', '*,+', {
						type: 'string',
						enableQuery: { _id: 'LDAP_Enable', value: true },
						invalidValue: '*,+',
					});
				});

				this.section('LDAP_DataSync_AutoLogout', function () {
					this.add('LDAP_Sync_AutoLogout_Enabled', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					this.add('LDAP_Sync_AutoLogout_Interval', 'Every 5 minutes', {
						type: 'string',
						enableQuery: [enableQuery, { _id: 'LDAP_Sync_AutoLogout_Enabled', value: true }],
						invalidValue: '',
					});
				});

				this.section('LDAP_DataSync_CustomFields', function () {
					this.add('LDAP_Sync_Custom_Fields', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					this.add('LDAP_CustomFieldMap', '{}', {
						type: 'code',
						multiline: true,
						enableQuery: [enableQuery, { _id: 'LDAP_Sync_Custom_Fields', value: true }],
						invalidValue: '{}',
					});
				});

				this.section('LDAP_DataSync_Roles', function () {
					this.add('LDAP_Sync_User_Data_Roles', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});
					const syncRolesQuery = [enableQuery, { _id: 'LDAP_Sync_User_Data_Roles', value: true }];
					this.add('LDAP_Sync_User_Data_Roles_AutoRemove', false, {
						type: 'boolean',
						enableQuery: syncRolesQuery,
						invalidValue: false,
					});

					this.add('LDAP_Sync_User_Data_Roles_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
						type: 'string',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});

					this.add('LDAP_Sync_User_Data_Roles_BaseDN', '', {
						type: 'string',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});

					this.add('LDAP_Sync_User_Data_RolesMap', '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}', {
						type: 'code',
						multiline: true,
						public: false,
						code: 'application/json',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});
				});

				this.section('LDAP_DataSync_Channels', function () {
					this.add('LDAP_Sync_User_Data_Channels', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					const syncChannelsQuery = [enableQuery, { _id: 'LDAP_Sync_User_Data_Channels', value: true }];

					this.add('LDAP_Sync_User_Data_Channels_Admin', 'rocket.cat', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: 'rocket.cat',
					});

					this.add('LDAP_Sync_User_Data_Channels_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: '',
					});

					this.add('LDAP_Sync_User_Data_Channels_BaseDN', '', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: '',
					});

					this.add(
						'LDAP_Sync_User_Data_ChannelsMap',
						'{\n\t"employee": "general",\n\t"techsupport": [\n\t\t"helpdesk",\n\t\t"support"\n\t]\n}',
						{
							type: 'code',
							multiline: true,
							public: false,
							code: 'application/json',
							enableQuery: syncChannelsQuery,
							invalidValue: '',
						},
					);

					this.add('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', false, {
						type: 'boolean',
						enableQuery: syncChannelsQuery,
						invalidValue: false,
					});
				});

				this.section('LDAP_DataSync_Teams', function () {
					this.add('LDAP_Enable_LDAP_Groups_To_RC_Teams', false, {
						type: 'boolean',
						enableQuery: { _id: 'LDAP_Enable', value: true },
						invalidValue: false,
					});

					const enableQueryTeams = { _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: true };

					this.add('LDAP_Groups_To_Rocket_Chat_Teams', '{}', {
						type: 'code',
						enableQuery: enableQueryTeams,
						invalidValue: '{}',
					});
					this.add('LDAP_Validate_Teams_For_Each_Login', false, {
						type: 'boolean',
						enableQuery: enableQueryTeams,
						invalidValue: false,
					});
					this.add('LDAP_Teams_BaseDN', '', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});
					this.add('LDAP_Teams_Name_Field', 'ou,cn', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});

					this.add('LDAP_Query_To_Get_User_Teams', '(&(ou=*)(uniqueMember=#{userdn}))', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});
				});
			},
		);
	});
}
