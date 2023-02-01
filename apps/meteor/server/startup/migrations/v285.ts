import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 285,
	async up() {
		const legacySlaSysMsgIds = await Messages.find(
			{ t: 'livechat_priority_history' },
			{
				projection: {
					_id: 1,
				},
			},
		)
			.map(({ _id }) => _id)
			.toArray();

		// rename the type to 'omnichannel_sla_change_history'
		// rename field 'priorityData' to 'slaData'
		// rename field 'priorityData.definedBy' to 'slaData.definedBy'
		// rename field 'priorityData.priority' to 'slaData.sla'
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
