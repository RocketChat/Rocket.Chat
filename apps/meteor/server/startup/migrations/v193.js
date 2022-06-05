import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

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
