import { Migrations } from '/app/migrations';
import { Subscriptions, Settings, Users } from '/app/models';

Migrations.add({
	version: 118,
	up() {
		Subscriptions.update({
			emailNotifications: 'all',
			emailPrefOrigin: 'user',
		}, {
			$set: {
				emailNotifications: 'mentions',
			},
		}, {
			multi:true,
		});

		Users.update({
			'settings.preferences.emailNotificationMode': 'disabled',
		}, {
			$set: {
				'settings.preferences.emailNotificationMode': 'nothing',
			},
		}, {
			multi:true,
		});

		Users.update({
			'settings.preferences.emailNotificationMode': 'all',
		}, {
			$set: {
				'settings.preferences.emailNotificationMode': 'mentions',
			},
		}, {
			multi:true,
		});

		Settings.update({
			_id: 'Accounts_Default_User_Preferences_emailNotificationMode',
			value: 'disabled',
		}, {
			$set: {
				value: 'nothing',
			},
		});

		Settings.update({
			_id: 'Accounts_Default_User_Preferences_emailNotificationMode',
			value: 'all',
		}, {
			$set: {
				value: 'mentions',
			},
		});

		// set user highlights on subscriptions
		Users.find({
			'settings.preferences.highlights.0': { $exists: true },
		}, {
			fields: {
				'settings.preferences.highlights': 1,
			},
		}).forEach((user) => {
			Subscriptions.update({
				'u._id': user._id,
			}, {
				$set: {
					userHighlights: user.settings.preferences.highlights,
				},
			}, {
				multi: true,
			});
		});
	},
});
