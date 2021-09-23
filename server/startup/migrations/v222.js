import { addMigration } from '../../lib/migrations';
import { LivechatRooms, Subscriptions } from '../../../app/models/server';

addMigration({
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
