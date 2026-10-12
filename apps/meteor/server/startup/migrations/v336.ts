import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Fix usersCount of group DMs that lost members through user deletion',
	async up() {
		// Deleting a user removed them from group DMs without decrementing usersCount,
		// leaving rooms whose usersCount no longer matches the number of uids.
		await Rooms.col.updateMany(
			{
				t: 'd',
				usersCount: { $gt: 2 },
				uids: { $exists: true },
				$expr: { $ne: [{ $size: '$uids' }, '$usersCount'] },
			},
			[{ $set: { usersCount: { $size: '$uids' } } }],
		);
	},
});
