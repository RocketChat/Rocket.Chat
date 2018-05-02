RocketChat.Migrations.add({
	version: 116,
	up() {

		// set pref origin to all existing preferences
		RocketChat.models.Subscriptions.update({
			desktopNotifications: { $exists: true }
		}, {
			$set: {
				desktopPrefOrigin: 'subscription'
			}
		});
		RocketChat.models.Subscriptions.update({
			mobilePushNotifications: { $exists: true }
		}, {
			$set: {
				mobilePrefOrigin: 'subscription'
			}
		});
		RocketChat.models.Subscriptions.update({
			emailNotifications: { $exists: true }
		}, {
			$set: {
				emailPrefOrigin: 'subscription'
			}
		});

		// set user preferences on subscriptions
		RocketChat.models.Users.find({
			$or: [
				{ 'settings.preferences.desktopNotifications': { $exists: true } },
				{ 'settings.preferences.mobileNotifications': { $exists: true } },
				{ 'settings.preferences.emailNotificationMode': { $exists: true } }
			]
		}).forEach(user => {
			if (user.settings.preferences.desktopNotifications && user.settings.preferences.desktopNotifications !== 'default') {
				RocketChat.models.Subscriptions.update({
					'u._id': user._id,
					desktopPrefOrigin: { $exists: false }
				}, {
					$set: {
						desktopNotifications: user.settings.preferences.desktopNotifications,
						desktopPrefOrigin: 'user'
					}
				});
			}

			if (user.settings.preferences.mobileNotifications && user.settings.preferences.mobileNotifications !== 'default') {
				RocketChat.models.Subscriptions.update({
					'u._id': user._id,
					mobilePrefOrigin: { $exists: false }
				}, {
					$set: {
						mobileNotifications: user.settings.preferences.mobileNotifications,
						mobilePrefOrigin: 'user'
					}
				});
			}

			if (user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode !== 'default') {
				RocketChat.models.Subscriptions.update({
					'u._id': user._id,
					emailPrefOrigin: { $exists: false }
				}, {
					$set: {
						emailNotifications: user.settings.preferences.emailNotificationMode === 'disabled' ? 'nothing' : user.settings.preferences.emailNotificationMode,
						emailPrefOrigin: 'user'
					}
				});
			}
		});
	}
});
