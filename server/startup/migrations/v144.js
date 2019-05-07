import { Migrations } from 'meteor/rocketchat:migrations';
import { Rooms } from 'meteor/rocketchat:models';

Migrations.add({
	version: 134,
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
