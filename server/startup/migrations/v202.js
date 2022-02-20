import { addMigration } from '../../lib/migrations';
import { Uploads } from '../../../app/models/server/raw';

addMigration({
	version: 202,
	async up() {
		await Uploads.updateMany(
			{
				type: 'audio/mp3',
			},
			{
				$set: {
					type: 'audio/mpeg',
				},
			},
		);
	},
});
