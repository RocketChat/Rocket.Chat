import { Migrations } from '../../../app/migrations/server';
import { Rooms } from '../../../app/models';

Migrations.add({
	version: 145,
	up() {
		Rooms.update({
			ro: true,
			muted: {
				$exists: true,
				$not: {
					$size: 0,
				},
			},
		}, {
			$set: {
				muted: [],
			},
		}, {
			multi: true,
		});
	},
});
