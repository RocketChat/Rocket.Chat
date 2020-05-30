import { Migrations } from '../../migrations';
import { Settings, Subscriptions } from '../../../app/models/server/raw';

Migrations.add({
	version: 190,
	up() {
		// Remove unused settings
		Promise.await(Settings.col.deleteOne({ _id: 'Accounts_Default_User_Preferences_desktopNotificationDuration' }));
		Promise.await(Subscriptions.col.updateMany({
			desktopNotificationDuration: {
				$exists: true,
			},
		}, {
			$unset: {
				desktopNotificationDuration: 1,
			},
		}));
	},
});
