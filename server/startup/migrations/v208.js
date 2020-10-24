import { Migrations } from '../../../app/migrations';
import { LivechatRooms, Subscriptions } from '../../../app/models/server';

Migrations.add({
	version: 208,
	up() {
		Subscriptions.find({
			t: 'l',
			department: { $exists: false },
		}).forEach((subscription) => {
			const { _id, rid } = subscription;
			const room = LivechatRooms.findOneById(rid);
			if (!room && !room.departmentId) {
				return;
			}

			Subscriptions.update({
				_id,
			}, {
				$set: {
					department: room.departmentId,
				},
			});
		});
	},
});
