import { addMigration } from '../../lib/migrations';
import { Settings, Subscriptions } from '../../../app/models/server/raw';

addMigration({
	version: 190,
	up() {
		// Remove unused settings
		Promise.await(Settings.removeById('Accounts_Default_User_Preferences_desktopNotificationDuration'));
		Promise.await(
			Subscriptions.col.updateMany(
				{
					desktopNotificationDuration: {
						$exists: true,
					},
				},
				{
					$unset: {
						desktopNotificationDuration: 1,
					},
				},
			),
		);
	},
});
