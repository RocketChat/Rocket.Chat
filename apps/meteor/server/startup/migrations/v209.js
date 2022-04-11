import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';
import { LivechatRooms, Subscriptions } from '../../../app/models/server';

addMigration({
	version: 209,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const list = await mongo.db.listCollections({ name: 'view_livechat_queue_status' }).toArray();
		if (list.length > 0) {
			await mongo.db.dropCollection('view_livechat_queue_status');
		}

		Subscriptions.find({
			t: 'l',
			department: { $exists: false },
		}).forEach((subscription) => {
			const { _id, rid } = subscription;
			const room = LivechatRooms.findOneById(rid);
			if (!room && !room.departmentId) {
				return;
			}

			Subscriptions.update(
				{
					_id,
				},
				{
					$set: {
						department: room.departmentId,
					},
				},
			);
		});
	},
});
