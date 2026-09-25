import { Settings } from '@rocket.chat/models';

import { db } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 342,
	name: 'Remove Atlassian Crowd integration: delete CROWD_* settings and the CROWD_Sync cron job',
	async up() {
		await Settings.deleteMany({ $or: [{ _id: { $regex: /^CROWD_/ } }, { _id: 'AtlassianCrowd' }] });
		await db.collection('rocketchat_cron').deleteMany({ name: 'CROWD_Sync' });
	},
});
