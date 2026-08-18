import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 337,
	name: 'Remove FileUpload_S3_SignatureVersion setting',
	async up() {
		await Settings.deleteOne({ _id: 'FileUpload_S3_SignatureVersion' });
	},
});
