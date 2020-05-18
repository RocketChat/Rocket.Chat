import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 190,
	up() {
		// Remove unused settings
		Settings.remove({ _id: 'Accounts_Default_User_Preferences_desktopNotificationDuration' });
	},
});
