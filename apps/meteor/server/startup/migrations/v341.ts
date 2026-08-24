import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 341,
	name: 'Remove deprecated legacy (non-native) federation settings',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'FEDERATION_Enabled',
					'FEDERATION_Status',
					'FEDERATION_Domain',
					'FEDERATION_Public_Key',
					'FEDERATION_Discovery_Method',
					'FEDERATION_Test_Setup',
				],
			},
		});
	},
});
