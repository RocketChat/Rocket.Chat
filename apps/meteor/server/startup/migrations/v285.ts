import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 285,
	async up() {
		// migrate old priority history messages to new sla history messages
		const legacySlaSysMsgIds = await Messages.find(
			// intentionally using any since this is a legacy type which we've removed
			{ t: 'livechat_priority_history' as any },
			{
				projection: {
					_id: 1,
				},
			},
		)
			.map(({ _id }) => _id)
			.toArray();

		await Messages.updateMany(
			{ _id: { $in: legacySlaSysMsgIds } },
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
