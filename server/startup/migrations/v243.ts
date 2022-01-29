import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 243,
	async up() {
		const mobileNotificationsSetting = await Settings.findOneById('Accounts_Default_User_Preferences_mobileNotifications');

		await Settings.removeById('Accounts_Default_User_Preferences_mobileNotifications');
		if (mobileNotificationsSetting?.value) {
			Settings.update(
				{
					_id: 'Accounts_Default_User_Preferences_pushNotifications',
				},
				{
					$set: {
						value: mobileNotificationsSetting.value,
					},
				},
				{
					upsert: true,
				},
			);
		}

		Users.update(
			{ 'settings.preferences.mobileNotifications': { $exists: 1 } },
			{
				$rename: {
					'settings.preferences.mobileNotifications': 'settings.preferences.pushNotifications',
				},
			},
			{ multi: true },
		);
	},
});
