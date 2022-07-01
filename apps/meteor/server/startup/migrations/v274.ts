import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 274,
	async up() {
		const fieldsToUpdate = ['editedBy', 'editedAt', 'emoji', 'avatar', 'alias', 'customFields', 'groupable', 'attachments', 'reactions'];

		fieldsToUpdate.map(async (field) => {
			await Messages.updateMany(
				{
					$or: [{ [field]: { $type: 'undefined' } }, { [field]: { $type: 'null' } }],
				},
				{
					$unset: {
						[field]: '',
					},
				},
			);
		});

		await Promise.all(fieldsToUpdate);
	},
});
