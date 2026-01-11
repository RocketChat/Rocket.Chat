import { CallHistory, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 332,
	name: 'Fill contact information on older call history entries',
	async up() {
		const cursor = CallHistory.col.aggregate([
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
			{
				$merge: {
					into: CallHistory.col.collectionName,
					on: '_id',
					whenMatched: 'merge',
				},
			},
		]);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for await (const _item of cursor) {
			//
		}
	},
});
