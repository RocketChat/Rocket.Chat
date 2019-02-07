RocketChat.Migrations.add({
	version: 118,
	up() {
		RocketChat.models.Subscriptions.update({
			emailNotifications: 'all',
			emailPrefOrigin: 'user',
		}, {
			$set: {
				emailNotifications: 'mentions',
			},
		}, {
			multi:true,
		});

		RocketChat.models.Users.update({
			'settings.preferences.emailNotificationMode': 'disabled',
		}, {
			$set: {
				'settings.preferences.emailNotificationMode': 'nothing',
			},
		}, {
			multi:true,
		});

		RocketChat.models.Users.update({
			'settings.preferences.emailNotificationMode': 'all',
		}, {
			$set: {
				'settings.preferences.emailNotificationMode': 'mentions',
			},
		}, {
			multi:true,
		});

		RocketChat.models.Settings.update({
			_id: 'Accounts_Default_User_Preferences_emailNotificationMode',
			value: 'disabled',
		}, {
			$set: {
				value: 'nothing',
			},
		});

		RocketChat.models.Settings.update({
			_id: 'Accounts_Default_User_Preferences_emailNotificationMode',
			value: 'all',
		}, {
			$set: {
				value: 'mentions',
			},
		});

		// set user highlights on subscriptions
		RocketChat.models.Users.find({
			'settings.preferences.highlights.0': { $exists: true },
		}, {
			fields: {
				'settings.preferences.highlights': 1,
			},
		}).forEach((user) => {
			RocketChat.models.Subscriptions.update({
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
