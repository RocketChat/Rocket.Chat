import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

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
