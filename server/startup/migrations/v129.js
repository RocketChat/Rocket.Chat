import { Migrations } from '/app/migrations';
import { Users, Subscriptions } from '/app/models';

Migrations.add({
	version: 129,
	up() {
		Users.find({
			$or: [
				{ 'settings.preferences.desktopNotifications': { $exists: true, $ne: 'default' } },
				{ 'settings.preferences.mobileNotifications': { $exists: true, $ne: 'default' } },
				{ 'settings.preferences.emailNotificationMode': { $exists: true, $ne: 'default' } },
			],
		}, {
			fields: {
				'settings.preferences.desktopNotifications': 1,
				'settings.preferences.mobileNotifications': 1,
				'settings.preferences.emailNotificationMode': 1,
			},
		}).forEach((user) => {
			if (user.settings.preferences.desktopNotifications && user.settings.preferences.desktopNotifications !== 'default') {
				Subscriptions.update({
					'u._id': user._id,
					desktopPrefOrigin: 'user',
					desktopNotifications: null,
				}, {
					$set: {
						desktopNotifications: user.settings.preferences.desktopNotifications,
					},
				}, {
					multi: true,
				});
			}

			if (user.settings.preferences.mobileNotifications && user.settings.preferences.mobileNotifications !== 'default') {
				Subscriptions.update({
					'u._id': user._id,
					mobilePrefOrigin: 'user',
					mobilePushNotifications: null,
				}, {
					$set: {
						mobilePushNotifications: user.settings.preferences.mobileNotifications,
					},
				}, {
					multi: true,
				});
			}

			if (user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode !== 'default') {
				Subscriptions.update({
					'u._id': user._id,
					emailPrefOrigin: 'user',
					emailNotifications: null,
				}, {
					$set: {
						emailNotifications: user.settings.preferences.emailNotificationMode === 'disabled' || user.settings.preferences.emailNotificationMode === 'nothing' ? 'nothing' : 'mentions',
					},
				}, {
					multi: true,
				});
			}
		});
	},
});
