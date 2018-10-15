RocketChat.Migrations.add({
	version: 125,
	up() {
		RocketChat.models.Users.update({
			'settings.preferences.groupByType': { $exists: true },
		}, {
			$rename: {
				'settings.preferences.groupByType': 'settings.preferences.sidebarGroupByType',
			},
		}, {
			multi: true,
		});
	},
});
