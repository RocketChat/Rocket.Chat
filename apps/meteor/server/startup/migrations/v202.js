import { Uploads } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

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
