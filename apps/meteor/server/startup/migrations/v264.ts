import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 264,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const npsVote = mongo.db.collection('rocketchat_nps_vote');

		const duplicated = await npsVote
			.aggregate([
				{
					$group: {
						_id: { identifier: '$identifier', npsId: '$npsId' },
						total: { $sum: 1 },
						firstId: { $first: '$_id' },
					},
				},
				{
					$match: {
						total: { $gt: 1 },
					},
				},
			])
			.toArray(); // since there should not be too much duplicated, it is safe to use .toArray()

		await Promise.all(
			duplicated.map((record) =>
				npsVote.deleteMany({
					_id: { $ne: record.firstId },
					identifier: record._id.identifier,
					npsId: record._id.npsId,
				}),
			),
		);

		await npsVote.dropIndex('npsId_1_identifier_1');
		await npsVote.createIndex({ npsId: 1, identifier: 1 }, { unique: true });
	},
});
