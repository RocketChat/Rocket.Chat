import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 311,
	name: 'Update default behavior of E2E_Enabled_Mentions setting, to allow mentions in encrypted messages by default.',
	async up() {
		// TODO: audit
		await Settings.updateOne(
			{
				_id: 'E2E_Enabled_Mentions',
			},
			{
				$set: {
					value: true,
					packageValue: true,
				},
			},
		);
	},
});
