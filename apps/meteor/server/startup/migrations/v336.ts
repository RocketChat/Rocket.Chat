import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove deprecated FileUpload_S3_SignatureVersion setting',
	async up() {
		await Settings.removeById('FileUpload_S3_SignatureVersion');
	},
});
