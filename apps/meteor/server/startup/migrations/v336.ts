import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove MedSense documentation prefill webhook settings',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: ['Medsense_Documentation_Prefill_Webhook_Url', 'Medsense_Documentation_Prefill_Webhook_Secret'],
			},
		});
	},
});
