import { Migrations } from '../../../app/migrations/server';
import { CannedResponse } from '../../../ee/app/models/server';

function migrateCannedResponses() {
	CannedResponse.tryDropIndex({ shortcut: 1 });

	const responses1 = Promise.await(CannedResponse.model.rawCollection().aggregate([
		{ $match: { shortcut: { $exists: true } } },
		{ $group: {
			_id: { shortcut: '$shortcut' },
			uniqueIds: { $addToSet: '$_id' },
			count: { $sum: 1 },
		} },
		{ $match: { count: { $gte: 2 } } },
	]).toArray());

	const operations = [];

	for (const response of responses1) {
		const { _id: { shortcut: key }, uniqueIds: ids } = response;
		let currentIndex = 0;

		for (const id of ids) {
			if (!currentIndex) {
				currentIndex += 1;
				continue;
			}

			operations.push({
				updateOne: {
					filter: { _id: id },
					update: {
						$set: {
							shortcut: `${ key }-${ currentIndex }`,
						},
					},
				},
			});
			currentIndex += 1;
		}
	}

	if (operations.length) {
		Promise.await(CannedResponse.model.rawCollection().bulkWrite(operations, { ordered: false }));
	}

	CannedResponse.tryEnsureIndex({ shortcut: 1 }, { unique: true });
}

Migrations.add({
	version: 227,
	up() {
		migrateCannedResponses();
	},
});
