import { Migrations } from '../../../app/migrations/server';
import { Rooms } from '../../../app/models/server/raw';

Migrations.add({
	version: 193,
	up() {
		Promise.await(Rooms.col.updateMany({
			sysMes: 'subscription_role_added',
		}, {
			$set: {
				'sysMes.$': 'subscription-role-added',
			},
		}));

		Promise.await(Rooms.col.updateMany({
			sysMes: 'subscription_role_removed',
		}, {
			$set: {
				'sysMes.$': 'subscription-role-removed',
			},
		}));
	},
});
