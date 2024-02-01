import { settingsRegistry } from '../../../app/settings/server';

export const ldapIntervalValuesToCronMap: Record<string, string> = {
	every_1_hour: '0 * * * *',
	every_6_hours: '0 */6 * * *',
	every_12_hours: '0 */12 * * *',
	every_24_hours: '0 0 * * *',
	every_48_hours: '0 0 */2 * *',
};

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('LDAP', async function () {
		const enableQuery = { _id: 'LDAP_Enable', value: true };

		await this.with(
			{
				tab: 'LDAP_Enterprise',
				enterprise: true,
				modules: ['ldap-enterprise'],
			},
			async function () {
				await this.section('LDAP_DataSync_BackgroundSync', async function () {
					await this.add('LDAP_Background_Sync', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					const backgroundSyncQuery = [enableQuery, { _id: 'LDAP_Background_Sync', value: true }];

					await this.add('LDAP_Background_Sync_Interval', 'every_24_hours', {
						type: 'select',
						values: [
							{
								key: 'every_1_hour',
								i18nLabel: 'every_hour',
							},
							{
								key: 'every_6_hours',
								i18nLabel: 'every_six_hours',
							},
							{
								key: 'every_12_hours',
								i18nLabel: 'every_12_hours',
							},
							{
								key: 'every_24_hours',
								i18nLabel: 'every_24_hours',
							},
							{
								key: 'every_48_hours',
								i18nLabel: 'every_48_hours',
							},
						],
						enableQuery: backgroundSyncQuery,
						invalidValue: 'every_24_hours',
					});

					await this.add('LDAP_Background_Sync_Import_New_Users', true, {
						type: 'boolean',
						enableQuery: backgroundSyncQuery,
						invalidValue: true,
					});

					await this.add('LDAP_Background_Sync_Keep_Existant_Users_Updated', true, {
						type: 'boolean',
						enableQuery: backgroundSyncQuery,
						invalidValue: true,
					});

					await this.add('LDAP_Background_Sync_Merge_Existent_Users', false, {
						type: 'boolean',
						enableQuery: [
							...backgroundSyncQuery,
							{ _id: 'LDAP_Background_Sync_Keep_Existant_Users_Updated', value: true },
							{ _id: 'LDAP_Merge_Existing_Users', value: true },
						],
						invalidValue: false,
					});

					await this.add('LDAP_Background_Sync_Avatars', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					await this.add('LDAP_Background_Sync_Avatars_Interval', '0 0 * * *', {
						type: 'string',
						enableQuery: [enableQuery, { _id: 'LDAP_Background_Sync_Avatars', value: true }],
						invalidValue: '0 0 * * *',
					});
				});

				await this.section('LDAP_DataSync_Advanced', async function () {
					await this.add('LDAP_Sync_User_Active_State', 'disable', {
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

					await this.add('LDAP_User_Search_AttributesToQuery', '*,+', {
						type: 'string',
						enableQuery: { _id: 'LDAP_Enable', value: true },
						invalidValue: '*,+',
					});
				});

				await this.section('LDAP_DataSync_AutoLogout', async function () {
					await this.add('LDAP_Sync_AutoLogout_Enabled', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					await this.add('LDAP_Sync_AutoLogout_Interval', 'Every 5 minutes', {
						type: 'string',
						enableQuery: [enableQuery, { _id: 'LDAP_Sync_AutoLogout_Enabled', value: true }],
						invalidValue: '',
					});
				});

				await this.section('LDAP_DataSync_CustomFields', async function () {
					await this.add('LDAP_Sync_Custom_Fields', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					await this.add('LDAP_CustomFieldMap', '{}', {
						type: 'code',
						multiline: true,
						enableQuery: [enableQuery, { _id: 'LDAP_Sync_Custom_Fields', value: true }],
						invalidValue: '{}',
					});
				});

				await this.section('LDAP_DataSync_Roles', async function () {
					await this.add('LDAP_Sync_User_Data_Roles', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});
					const syncRolesQuery = [enableQuery, { _id: 'LDAP_Sync_User_Data_Roles', value: true }];
					await this.add('LDAP_Sync_User_Data_Roles_AutoRemove', false, {
						type: 'boolean',
						enableQuery: syncRolesQuery,
						invalidValue: false,
					});

					await this.add('LDAP_Sync_User_Data_Roles_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
						type: 'string',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});

					await this.add('LDAP_Sync_User_Data_Roles_BaseDN', '', {
						type: 'string',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});

					await this.add('LDAP_Sync_User_Data_RolesMap', '{\n\t"rocket-admin": "admin",\n\t"tech-support": "support"\n}', {
						type: 'code',
						multiline: true,
						public: false,
						code: 'application/json',
						enableQuery: syncRolesQuery,
						invalidValue: '',
					});
				});

				await this.section('LDAP_DataSync_Channels', async function () {
					await this.add('LDAP_Sync_User_Data_Channels', false, {
						type: 'boolean',
						enableQuery,
						invalidValue: false,
					});

					const syncChannelsQuery = [enableQuery, { _id: 'LDAP_Sync_User_Data_Channels', value: true }];

					await this.add('LDAP_Sync_User_Data_Channels_Admin', 'rocket.cat', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: 'rocket.cat',
					});

					await this.add('LDAP_Sync_User_Data_Channels_Filter', '(&(cn=#{groupName})(memberUid=#{username}))', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: '',
					});

					await this.add('LDAP_Sync_User_Data_Channels_BaseDN', '', {
						type: 'string',
						enableQuery: syncChannelsQuery,
						invalidValue: '',
					});

					await this.add(
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

					await this.add('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', false, {
						type: 'boolean',
						enableQuery: syncChannelsQuery,
						invalidValue: false,
					});
				});

				await this.section('LDAP_DataSync_Teams', async function () {
					await this.add('LDAP_Enable_LDAP_Groups_To_RC_Teams', false, {
						type: 'boolean',
						enableQuery: { _id: 'LDAP_Enable', value: true },
						invalidValue: false,
					});

					const enableQueryTeams = { _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: true };

					await this.add('LDAP_Groups_To_Rocket_Chat_Teams', '{}', {
						type: 'code',
						enableQuery: enableQueryTeams,
						invalidValue: '{}',
					});
					await this.add('LDAP_Validate_Teams_For_Each_Login', false, {
						type: 'boolean',
						enableQuery: enableQueryTeams,
						invalidValue: false,
					});
					await this.add('LDAP_Teams_BaseDN', '', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});
					await this.add('LDAP_Teams_Name_Field', 'ou,cn', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});

					await this.add('LDAP_Query_To_Get_User_Teams', '(&(ou=*)(uniqueMember=#{userdn}))', {
						type: 'string',
						enableQuery: enableQueryTeams,
						invalidValue: '',
					});
				});
			},
		);
	});
}
