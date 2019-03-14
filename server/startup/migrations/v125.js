import { Migrations } from '/app/migrations';
import { Users } from '/app/models';

Migrations.add({
	version: 125,
	up() {
		Users.update({
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
