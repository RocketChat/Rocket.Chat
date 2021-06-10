import { Promise } from 'meteor/promise';

import { Migrations } from '../migrations';
import { Sessions } from '../../models/raw';
import { getMostImportantRole } from '../../utils/statistics/lib/getMostImportantRole';

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

	let actions = [];
	for await (const session of cursor) {
		actions.push({
			updateMany: {
				filter: { userId: session._id },
				update: { $set: { mostImportantRole: getMostImportantRole(session.user.roles) } },
			},
		});
		if (actions.length === 100) {
			await Sessions.col.bulkWrite(actions, { ordered: false });
			actions = [];
		}
	}
	if (actions.length) {
		await Sessions.col.bulkWrite(actions, { ordered: false });
	}
}

Migrations.add({
	version: 211,
	up() {
		Promise.await(migrateSessions());
	},
});
