import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 261,
	async up() {
		const settingsToFix = [
			'FEDERATION_Enabled',
			'FEDERATION_Status',
			'FEDERATION_Domain',
			'FEDERATION_Public_Key',
			'FEDERATION_Discovery_Method',
			'FEDERATION_Test_Setup',
		];

		const query = {
			_id: { $in: settingsToFix },
		};

		await Settings.updateMany(query, {
			$set: {
				section: 'Rocket.Chat Federation',
			},
		});
	},
});
