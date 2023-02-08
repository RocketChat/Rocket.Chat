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

		// update all livechat rooms to have the correct estimatedWaitingTimeQueue
		// this is a prop that we started to store recently, so we need to update all rooms to have this prop
		const existingSLAs = await OmnichannelServiceLevelAgreements.find().toArray();
		if (existingSLAs.length) {
			const promises = existingSLAs.map(async (sla) => {
				await LivechatRooms.updateMany(
					{
						t: 'l',
						slaId: sla._id,
					},
					{
						$set: {
							estimatedWaitingTimeQueue: sla.dueTimeInMinutes,
						},
					},
				);
			});
			await Promise.all(promises);
		}
		// for all other livechat rooms, set the estimatedWaitingTimeQueue to the default SLA due time
		await LivechatRooms.updateMany(
			{
				t: 'l',
				estimatedWaitingTimeQueue: { $exists: false },
			},
			{
				$set: {
					estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
				},
			},
		);
	},
});
