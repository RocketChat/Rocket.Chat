import { Migrations } from 'meteor/rocketchat:migrations';
import { Rooms } from 'meteor/rocketchat:models';

Migrations.add({
	version: 115,
	up() {
		Rooms.update({
			'announcement.message': { $exists: true },
		}, {
			$unset: { announcement: 1 },
		}, { multi: true });
	},
});
