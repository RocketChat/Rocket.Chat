import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 335,
	name: 'Remove OTR_Enable and OTR_Count settings',
	async up() {
		await Settings.deleteMany({ _id: { $in: ['OTR_Enable', 'OTR_Count'] } });
	},
});
