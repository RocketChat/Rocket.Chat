import { Promise } from 'meteor/promise';

import { Migrations } from '../../../app/migrations';
import { Sessions } from '../../../app/models/server/raw';
import { getMostImportantRole } from '../../../app/statistics/server/lib/getMostImportantRole';

async function migrateSessions() {
	const cursor = Sessions.col.aggregate([{
		$match: { $or: [{ mostImportantRole: { $exists: 0 } }, { mostImportantRole: null }] },
	}, {
		$group: {
			_id: '$userId',
		},
	}, {
		$lookup: {
			from: 'users',
			localField: '_id',
			foreignField: '_id',
			as: 'user',
		},
	}, {
		$unwind: '$user',
	}, {
		$project: {
			'user.roles': 1,
		},
	}, {
		$match: { 'user.roles.0': { $exists: 1 } },
	}]);

	for await (const session of cursor) {
		await Sessions.col.updateMany({ userId: session._id }, { $set: { mostImportantRole: getMostImportantRole(session.user.roles) } });
	}
}

Migrations.add({
	version: 211,
	up() {
		Promise.await(migrateSessions());
	},
});
