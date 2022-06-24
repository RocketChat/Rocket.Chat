import { Settings, Subscriptions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

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
