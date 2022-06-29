import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		const fieldsToUpdate = ['editedBy', 'editedAt', 'emoji', 'avatar', 'alias', 'customFields', 'groupable', 'attachments', 'reactions'];

		fieldsToUpdate.map(async (field) => {
			await Messages.update(
				{
					[field]: {
						$in: [null, undefined],
					},
				},
				{
					$unset: {
						[field]: '',
					},
				},
				{
					multi: true,
				},
			);
		});

		await Promise.all(fieldsToUpdate);
	},
});
