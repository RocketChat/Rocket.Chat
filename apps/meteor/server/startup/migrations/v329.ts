import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 329,
	name: 'Remove VoIP Toggle Setting',
	async up() {
		await Settings.deleteOne({ _id: 'VoIP_TeamCollab_Enabled' });
	},
});
