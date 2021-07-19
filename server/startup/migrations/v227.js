import { Migrations } from '../../../app/migrations/server';
import { CannedResponse } from '../../../ee/app/models/server';

function migrateCannedResponses() {
	CannedResponse.tryDropIndex({ shortcut: 1 });
	// get all canned responses
	const currentResponseIndex = {};
	const responses = CannedResponse.find({}, { fields: { _id: 1, shortcut: 1 } }).fetch();
	const operations = [];

	for (const response of responses) {
		const { shortcut } = response;
		let currentIndex = currentResponseIndex[shortcut];
		if (!currentIndex && !(currentIndex === 0)) {
			currentResponseIndex[shortcut] = 0;
		} else {
			currentResponseIndex[shortcut] += 1;
		}
		currentIndex = currentResponseIndex[shortcut];

		if (currentIndex > 0) {
			operations.push({
				updateOne: {
					filter: { _id: response._id },
					update: {
						$set: {
							shortcut: `${ shortcut }-${ currentIndex }`,
						},
					},
				},
			});
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
