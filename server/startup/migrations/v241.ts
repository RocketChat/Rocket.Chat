import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
	version: 241,
	up() {
		const mobileNotificationsSetting = Settings.findOneById('Accounts_Default_User_Preferences_mobileNotifications');

		Settings.removeById('Accounts_Default_User_Preferences_mobileNotifications');
		Settings.upsert({
			_id: 'Accounts_Default_User_Preferences_pushNotifications',
		}, {
			$set: {
				value: mobileNotificationsSetting.value,
			},
		});
	},
});
