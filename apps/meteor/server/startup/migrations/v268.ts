import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

// Removes deprecated RDStation functionality from Omnichannel
addMigration({
	version: 268,
	async up() {
		await Settings.removeById('Livechat_RDStation_Token');
	},
});
