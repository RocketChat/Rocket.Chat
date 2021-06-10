import Future from 'fibers/future';

import { Migrations } from '../migrations';
import { Users, Sessions } from '../../models/raw';

async function migrateSessions(fut) {
	const cursor = Users.find({ roles: 'anonymous' }, { projection: { _id: 1 } });
	if (!cursor) {
		return;
	}


	const users = await cursor.toArray();
	if (users.length === 0) {
		fut.return();
		return;
	}

	const userIds = users.map(({ _id }) => _id);

	Sessions.update({
		userId: { $in: userIds },
	}, {
		$set: {
			roles: ['anonymous'],
		},
	}, {
		multi: true,
	});

	fut.return();
}

Migrations.add({
	version: 208,
	up() {
		const fut = new Future();
		migrateSessions(fut);
		fut.wait();
	},
});
