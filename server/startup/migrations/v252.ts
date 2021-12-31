import { Rooms } from '../../../app/models/server/raw';
import { IOmnichannelRoom, OmnichannelSourceType } from '../../../definition/IRoom';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 252,
	async up() {
		await Rooms.updateMany(
			{ $and: [{ t: 'l' }, { source: { $exists: false } }] },
			{
				$set: {
					source: {
						type: OmnichannelSourceType.OTHER,
					} as IOmnichannelRoom['source'],
				},
			},
		);
	},
});
