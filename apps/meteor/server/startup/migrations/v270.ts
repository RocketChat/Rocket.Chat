import { VoipRoom } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 270,
	async up() {
		// mark all voip rooms as inbound which doesn't have any direction property set or has an invalid value
		await VoipRoom.updateMany(
			{
				t: 'v',
				$or: [{ direction: { $exists: false } }, { direction: { $nin: ['inbound', 'outbound'] } }],
			},
			{
				$set: {
					direction: 'inbound',
				},
			},
		);
	},
});
