import { Uploads } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 282,
	async up() {
		await Uploads.updateMany(
			{
				name: {
					$regex: 'thumb-',
				},
			},
			{
				typeGroup: 'thumbnail',
			},
		);
	},
});
