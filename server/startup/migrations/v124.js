RocketChat.Migrations.add({
	version: 124,
	up() {
		RocketChat.models.Users.update({
			'settings.preferences.mergeChannels': true,
		}, {
			$unset: {
				'settings.preferences.mergeChannels': 1,
			},
			$set: {
				'settings.preferences.groupByType': false,
			},
		}, {
			multi: true,
		});
		RocketChat.models.Users.update({
			'settings.preferences.mergeChannels': false,
		}, {
			$unset: {
				'settings.preferences.mergeChannels': 1,
			},
			$set: {
				'settings.preferences.groupByType': true,
			},
		}, {
			multi: true,
		});
	},
});
