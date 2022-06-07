import { addMigration } from '../../lib/migrations';
import { Rooms } from '../../../app/models/server/raw';

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
