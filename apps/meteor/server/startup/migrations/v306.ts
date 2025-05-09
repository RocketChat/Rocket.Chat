import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 306,
	name: 'Adds missing ignoreThreads parameter for old rooms with retention policy overridden',
	async up() {
		await Rooms.updateMany(
			{
				'retention.enabled': true,
				'retention.overrideGlobal': true,
				'retention.ignoreThreads': { $exists: false },
			},
			{
				$set: {
					'retention.ignoreThreads': false,
				},
			},
		);
	},
});
