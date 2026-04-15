import { CallHistory, Users } from '@rocket.chat/models';
import type { AnyBulkWriteOperation } from 'mongodb';

import { addMigration } from '../../lib/migrations';

const BATCH_SIZE = 500;

addMigration({
	version: 332,
	name: 'Fill contact information on older call history entries',
	async up() {
		const cursor = CallHistory.col.aggregate<{ _id: string; contactName: string | null; contactUsername: string | null }>([
			{
				$match: {
					external: false,
					contactId: { $exists: true },
					contactName: { $exists: false },
					contactUsername: { $exists: false },
				},
			},
			{
				$lookup: {
					from: Users.col.collectionName,
					localField: 'contactId',
					foreignField: '_id',
					as: 'contactDetails',
				},
			},
			{
				$addFields: {
					contactName: { $first: '$contactDetails.name' },
					contactUsername: { $first: '$contactDetails.username' },
				},
			},
			{
				$project: {
					contactName: 1,
					contactUsername: 1,
				},
			},
		]);

		// Materialise pipeline results into update ops. The pipeline used to end with an
		// aggregation merge stage, but that operator is unsupported on DocumentDB 5.0, so
		// we iterate the cursor and issue bulk updates instead.
		let ops: AnyBulkWriteOperation<any>[] = [];
		const flush = async () => {
			if (ops.length === 0) return;
			await CallHistory.col.bulkWrite(ops, { ordered: false });
			ops = [];
		};

		for await (const doc of cursor) {
			ops.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: { contactName: doc.contactName, contactUsername: doc.contactUsername } },
				},
			});
			if (ops.length >= BATCH_SIZE) {
				await flush();
			}
		}
		await flush();
	},
});
