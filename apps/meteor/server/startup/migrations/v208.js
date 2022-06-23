import { Users, Sessions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

async function migrateSessions() {
	const cursor = Users.find({ roles: 'anonymous' }, { projection: { _id: 1 } });
	if (!cursor) {
		return;
	}

	const users = await cursor.toArray();
	if (users.length === 0) {
		return;
	}

	const userIds = users.map(({ _id }) => _id);

	await Sessions.updateMany(
		{
			userId: { $in: userIds },
		},
		{
			$set: {
				roles: ['anonymous'],
			},
		},
	);
}

addMigration({
	version: 208,
	up() {
		Promise.await(migrateSessions());
	},
});
