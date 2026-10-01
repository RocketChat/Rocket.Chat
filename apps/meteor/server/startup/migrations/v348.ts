import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 348,
	name: 'Update packageValue of Livechat_enabled setting to false, preserving the current value',
	async up() {
		await Settings.updateOne({ _id: 'Livechat_enabled' }, { $set: { packageValue: false } });
	},
});