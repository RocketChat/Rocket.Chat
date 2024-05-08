import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	name: 'Remove LDAP Sync Teams settings',
	async up() {
		const settingsToReplace: { oldSetting: string; newSetting: string }[] = [
			{ oldSetting: 'LDAP_Sync_User_Data_Channels', newSetting: 'LDAP_Sync_User_Data_Rooms' },
			{ oldSetting: 'LDAP_Sync_User_Data_Channels_Admin', newSetting: 'LDAP_Sync_User_Data_Rooms_Admin' },
			{ oldSetting: 'LDAP_Sync_User_Data_Channels_Filter', newSetting: 'LDAP_Sync_User_Data_Rooms_Filter' },
			{ oldSetting: 'LDAP_Sync_User_Data_Channels_BaseDN', newSetting: 'LDAP_Sync_User_Data_Rooms_BaseDN' },
			{ oldSetting: 'LDAP_Sync_User_Data_ChannelsMap', newSetting: 'LDAP_Sync_User_Data_RoomsMap' },
			{ oldSetting: 'LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', newSetting: 'LDAP_Sync_User_Data_Rooms_Auto_Leave' },
		];
		const teamsSettingsToDelete = [
			'LDAP_Enable_LDAP_Groups_To_RC_Teams',
			'LDAP_Groups_To_Rocket_Chat_Teams',
			'LDAP_Validate_Teams_For_Each_Login',
			'LDAP_Teams_BaseDN',
			'LDAP_Teams_Name_Field',
			'LDAP_Query_To_Get_User_Teams',
		];
		const settingsToDelete = teamsSettingsToDelete.concat(settingsToReplace.map((settingReplacement) => settingReplacement.oldSetting));
		const promises = [];

		for await (const setting of settingsToReplace) {
			const oldSetting = await Settings.findOneById<Pick<ISetting, 'value'>>(setting.oldSetting, { projection: { value: 1 } });
			if (oldSetting?.value) {
				promises.push(Settings.updateOne({ _id: setting.newSetting }, { $set: { value: oldSetting.value } }));
			}
		}

		promises.push(Settings.deleteMany({ _id: { $in: settingsToDelete } }));
		await Promise.all(promises);
	},
});
