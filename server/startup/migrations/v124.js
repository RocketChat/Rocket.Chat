import { Migrations } from '/app/migrations';
import { Users } from '/app/models';

Migrations.add({
	version: 124,
	up() {
		Users.update({
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
		Users.update({
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
