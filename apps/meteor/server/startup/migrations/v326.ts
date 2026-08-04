import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 326,
	name: 'Close Omnichannel VoIP Rooms',
	async up() {
		await Rooms.updateMany(
			{
				t: 'v' as any,
				open: {
					$exists: true,
				},
			},
			{
				$unset: {
					open: 1,
				},
			},
		);
	},
});
