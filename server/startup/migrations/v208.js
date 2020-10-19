import Future from 'fibers/future';

import { Migrations } from '../../../app/migrations';
import { Users, Sessions } from '../../../app/models/server/raw';

async function migrateSessions(fut) {
	const userIds = await Sessions.col.distinct('userId', { roles: { $exists: false } });
	const items = await Users.find({ _id: { $in: userIds } }, { fields: { roles: 1 } });
	if (!items) {
		return;
	}
	const users = await items.toArray();

	for (const { _id, roles } of users) {
		Sessions.update({
			userId: _id,
		}, {
			$set: {
				roles,
			},
		}, {
			multi: true,
		});
	}

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
