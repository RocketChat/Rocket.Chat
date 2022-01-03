import { addMigration } from '../../lib/migrations';
import { Subscriptions, Users } from '../../../app/models/server';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 235,
	async up() {
		await Settings.removeById('Accounts_Default_User_Preferences_audioNotifications');

		// delete field from subscriptions
		Subscriptions.update(
			{
				audioNotifications: {
					$exists: true,
				},
			},
			{
				$unset: {
					audioNotifications: 1,
					audioPrefOrigin: 1,
				},
			},
			{ multi: true },
		);

		Subscriptions.tryDropIndex({ audioNotifications: 1 });

		// delete field from users
		Users.update(
			{
				'settings.preferences.audioNotifications': {
					$exists: true,
				},
			},
			{
				$unset: {
					'settings.preferences.audioNotifications': 1,
				},
			},
			{ multi: true },
		);
	},
});
