import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 266,
	async up() {
		await Rooms.updateMany(
			{ bridged: true },
			{
				$set: {
					federated: true,
				},
				$unset: {
					bridged: 1,
				},
			},
		);
	},
});
