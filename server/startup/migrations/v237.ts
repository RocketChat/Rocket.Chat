import { Migrations } from '../../../app/migrations/server';
import { settings } from '../../../app/settings/server';
import { Settings } from '../../../app/models/server';
import { isEnterprise } from '../../../ee/app/license/server';

function copySettingValue(newName: string, oldName: string): void {
	const value = settings.get(oldName);
	if (value === undefined) {
		return;
	}

	Settings.upsert({ _id: newName }, { $set: { value } });
}

Migrations.add({
	version: 237,
	up() {
		const isEE = isEnterprise();

		// Override AD defaults with the previously configured values
		copySettingValue('LDAP_AD_User_Search_Field', 'LDAP_User_Search_Field');
		copySettingValue('LDAP_AD_Username_Field', 'LDAP_Username_Field');

		// If we're sure the server is AD, then select it - otherwise keep it as generic ldap
		const useAdDefaults = settings.get('LDAP_User_Search_Field') === 'sAMAccountName';
		Settings.upsert({ _id: 'LDAP_Server_Type' }, { $set: { value: useAdDefaults ? 'ad' : '' } });

		// The setting to use the field map also determined if the user data was updated on login or not
		copySettingValue('LDAP_Update_Data_On_Login', 'LDAP_Sync_User_Data');

		let fieldMap;
		try {
			fieldMap = JSON.parse(settings.get<string>('LDAP_Sync_User_Data_FieldMap') ?? '');
		} catch (_error) {
			// Ignore any parsing errors;
		}

		if (fieldMap) {
			const newObject: Record<string, string> = {};

			for (const key in fieldMap) {
				if (!fieldMap.hasOwnProperty(key)) {
					continue;
				}

				if (fieldMap[key] === 'name') {
					Settings.upsert({ _id: 'LDAP_Name_Field' }, { $set: { value: key } });
					Settings.upsert({ _id: 'LDAP_AD_Name_Field' }, { $set: { value: key } });
					continue;
				}

				if (fieldMap[key] === 'email') {
					Settings.upsert({ _id: 'LDAP_Email_Field' }, { $set: { value: key } });
					Settings.upsert({ _id: 'LDAP_AD_Email_Field' }, { $set: { value: key } });
					continue;
				}

				newObject[fieldMap[key]] = key;
			}

			if (isEE) {
				const newJson = JSON.stringify(newObject);
				Settings.upsert({ _id: 'LDAP_CustomFieldMap' }, { $set: { value: newJson } });

				const syncCustomFields = Object.keys(newObject).length > 0 && settings.get('LDAP_Sync_User_Data');
				Settings.upsert({ _id: 'LDAP_Sync_Custom_Fields' }, { $set: { value: syncCustomFields } });
			}
		}

		copySettingValue('LDAP_Sync_User_Data_Roles', 'LDAP_Sync_User_Data_Groups');
		copySettingValue('LDAP_Sync_User_Data_Roles_AutoRemove', 'LDAP_Sync_User_Data_Groups_AutoRemove');
		copySettingValue('LDAP_Sync_User_Data_Roles_Filter', 'LDAP_Sync_User_Data_Groups_Filter');
		copySettingValue('LDAP_Sync_User_Data_Roles_BaseDN', 'LDAP_Sync_User_Data_Groups_BaseDN');
		copySettingValue('LDAP_Sync_User_Data_RolesMap', 'LDAP_Sync_User_Data_GroupsMap');
		copySettingValue('LDAP_Sync_User_Data_Channels', 'LDAP_Sync_User_Data_Groups_AutoChannels');
		copySettingValue('LDAP_Sync_User_Data_Channels_Admin', 'LDAP_Sync_User_Data_Groups_AutoChannels_Admin');
		copySettingValue('LDAP_Sync_User_Data_ChannelsMap', 'LDAP_Sync_User_Data_Groups_AutoChannelsMap');
		copySettingValue('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', 'LDAP_Sync_User_Data_Groups_Enforce_AutoChannels');

		copySettingValue('LDAP_Sync_User_Data_Channels_Filter', 'LDAP_Sync_User_Data_Groups_Filter');
		copySettingValue('LDAP_Sync_User_Data_Channels_BaseDN', 'LDAP_Sync_User_Data_Groups_BaseDN');

		Settings.remove({
			_id: {
				$in: [
					'LDAP_Sync_Now',
					'LDAP_Test_Connection',
					'LDAP_Sync_CustomFields',
					'LDAP_Sync_User_Data',
					'LDAP_Sync_User_Data_FieldMap',
					'LDAP_Enable_LDAP_Roles_To_RC_Roles',
					'LDAP_Roles_To_Rocket_Chat_Roles',
					'LDAP_Validate_Roles_For_Each_Login',
					'LDAP_Default_Role_To_User',
					'LDAP_Query_To_Get_User_Groups',
					'LDAP_Sync_User_Data_Groups',
					'LDAP_Sync_User_Data_Groups_AutoRemove',
					'LDAP_Sync_User_Data_Groups_Filter',
					'LDAP_Sync_User_Data_Groups_BaseDN',
					'LDAP_Sync_User_Data_GroupsMap',
					'LDAP_Sync_User_Data_Groups_AutoChannels',
					'LDAP_Sync_User_Data_Groups_AutoChannels_Admin',
					'LDAP_Sync_User_Data_Groups_AutoChannelsMap',
					'LDAP_Sync_User_Data_Groups_Enforce_AutoChannels',
					'LDAP_Internal_Log_Level',
				],
			},
		});
	},
});
