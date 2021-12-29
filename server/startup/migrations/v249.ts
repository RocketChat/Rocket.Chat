import { Settings } from '../../../app/models/server/raw';
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
