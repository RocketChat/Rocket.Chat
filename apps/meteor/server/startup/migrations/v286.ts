import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 286,
	async up() {
		// migrate old priority history messages to new sla history messages
		await Messages.updateMany(
			// intentionally using any since this is a legacy type which we've removed
			{ t: 'livechat_priority_history' as any },
			{
				$set: {
					't': 'omnichannel_sla_change_history',
					'slaData.definedBy': '$priorityData.definedBy',
					'slaData.sla': '$priorityData.priority',
				},
				$unset: {
					priorityData: 1,
				},
			},
		);
	},
});
