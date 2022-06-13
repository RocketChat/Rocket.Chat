import { VoipRoom } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 269,
	async up() {
		// mark all voip rooms as inbound which doesn't have any direction property set or has an invalid value
		await VoipRoom.updateMany(
			{
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
