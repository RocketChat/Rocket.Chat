import { CallHistory } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Fill contact name on external call history entries',
	async up() {
		await CallHistory.updateMany(
			{
				type: 'media-call',
				external: true,
				contactExtension: { $exists: true },
				$or: [{ contactName: { $exists: false } }, { contactName: '' }],
			},
			[
				{
					$set: {
						contactName: '$contactExtension',
					},
				},
			],
		);
	},
});
