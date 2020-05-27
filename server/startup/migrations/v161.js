import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 161,
	up() {
		const desktopNotifications = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_desktopNotifications' });
		const mobileNotifications = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_mobileNotifications' });

		if (desktopNotifications && desktopNotifications.value === 'mentions') {
			Settings.update({ _id: 'Accounts_Default_User_Preferences_desktopNotifications' }, {
				$set: { value: 'all' },
			});
		}

		if (mobileNotifications && mobileNotifications.value === 'mentions') {
			Settings.update({ _id: 'Accounts_Default_User_Preferences_mobileNotifications' }, {
				$set: { value: 'all' },
			});
		}
	},
	down() {
		// Down migration does not apply in this case
	},
});
