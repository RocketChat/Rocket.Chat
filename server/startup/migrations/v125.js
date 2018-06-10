RocketChat.Migrations.add({
	version: 125,
	up() {
		RocketChat.models.Users.update({}, {
			$rename: {
				'settings.preferences.groupByType': 'settings.preferences.sidebarGroupByType'
			}
		}, {
			multi: true
		});
	}
});
