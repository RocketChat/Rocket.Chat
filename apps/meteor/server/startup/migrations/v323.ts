import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 323,
	name: 'Remove VoIP_TeamCollab_Enabled setting',
	async up() {
		await Settings.deleteOne({ _id: 'VoIP_TeamCollab_Enabled' });
	},
});
