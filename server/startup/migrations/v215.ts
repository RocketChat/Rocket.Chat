import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

const removed = ['advocacy', 'industry', 'publicRelations', 'healthcarePharmaceutical', 'helpCenter'];

addMigration({
	version: 215,
	async up() {
		const current = await Settings.findOneById('Industry');
		if (current && typeof current.value === 'string' && removed.includes(current.value)) {
			await Settings.update(
				{
					_id: 'Industry',
				},
				{
					$set: {
						value: 'other',
					},
				},
			);
		}
	},
});
