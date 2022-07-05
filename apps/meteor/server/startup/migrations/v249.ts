import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 249,
	async up() {
		await Settings.updateOne(
			{
				_id: 'Industry',
				value: 'blockchain',
			},
			{
				$set: {
					value: 'other',
				},
			},
		);
	},
});
