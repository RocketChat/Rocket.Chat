import { Migrations } from '../../../app/migrations';
import { LivechatRooms, Subscriptions } from '../../../app/models/server';

Migrations.add({
	version: 222,
	async up() {
		Subscriptions.find({
			t: 'l',
		}).forEach((subscription) => {
			const { _id, rid } = subscription;
			const room = LivechatRooms.findOneById(rid, { open: 1 });
			if (room?.open) {
				return;
			}

			Subscriptions.remove({ _id });
		});
	},
});
