import { addMigration } from '../../lib/migrations';
import { Rooms } from '../../../app/models/server/raw';

addMigration({
	version: 193,
	up() {
		Promise.await(
			Rooms.col.updateMany(
				{
					sysMes: 'subscription_role_added',
				},
				{
					$set: {
						'sysMes.$': 'subscription-role-added',
					},
				},
			),
		);

		Promise.await(
			Rooms.col.updateMany(
				{
					sysMes: 'subscription_role_removed',
				},
				{
					$set: {
						'sysMes.$': 'subscription-role-removed',
					},
				},
			),
		);
	},
});
