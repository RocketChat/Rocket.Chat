import { addMigration } from '../../lib/migrations';
import { Settings, Users } from '../../../app/models/server';

addMigration({
	version: 243,
	up() {
		const mobileNotificationsSetting = Settings.findOneById('Accounts_Default_User_Preferences_mobileNotifications');

		Settings.removeById('Accounts_Default_User_Preferences_mobileNotifications');
		if (mobileNotificationsSetting && mobileNotificationsSetting.value) {
			Settings.upsert({
				_id: 'Accounts_Default_User_Preferences_pushNotifications',
			}, {
				$set: {
					value: mobileNotificationsSetting.value,
				},
			});
		}

		Users.update(
			{ 'settings.preferences.mobileNotifications': { $exists: 1 } },
			{ $rename: { 'settings.preferences.mobileNotifications': 'settings.preferences.pushNotifications' } },
			{ multi: true },
		);
	},
});
