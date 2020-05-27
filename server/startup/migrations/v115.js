import { Migrations } from '../../migrations';
import { Rooms } from '../../../app/models';

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
