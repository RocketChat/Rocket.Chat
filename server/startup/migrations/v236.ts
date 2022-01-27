import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 236,
	async up() {
		await Settings.removeById('Canned Responses');
		await Settings.removeById('Canned_Responses');

		await Settings.update(
			{
				_id: 'Canned_Responses_Enable',
			},
			{
				$set: {
					group: 'Omnichannel',
				},
			},
			{
				upsert: true,
			},
		);
	},
});
