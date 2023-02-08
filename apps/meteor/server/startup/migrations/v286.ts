import { LivechatPriorityWeight, DEFAULT_SLA_CONFIG } from '@rocket.chat/core-typings';
import { LivechatRooms, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 286,
	async up() {
		// update all livechat rooms to have default priority weight so the sorting on the livechat queue and current chats works as expected
		await LivechatRooms.updateMany(
			{
				t: 'l',
				priorityWeight: { $exists: false },
			},
			{
				$set: {
					priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
				},
			},
		);
	},
});
