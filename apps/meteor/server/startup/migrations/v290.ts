import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { LivechatRooms, Messages, LivechatPriority, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

// Migration to migrate old priorities to new SLAs, plus for new priorities feature
addMigration({
	version: 290,
	async up() {
		// CE may have been EE first, so it may hold priorities which we want to remove
		// IF env is not EE anymore, then just cleaning the collection is enough
		// IF it's still EE, populate new collection with SLAs
		const currentPriorities = await LivechatPriority.col.find().toArray();
		await LivechatPriority.deleteMany({});

		try {
			// remove indexes from livechat_priority collection
			await LivechatPriority.col.dropIndexes();
		} catch (error) {
			// ignore
			console.warn('Error dropping indexes from livechat_priority collection:', error);
		}

		// Since priorityId holds the "SLA ID" at this point, we need to rename the property so it doesn't conflict with current priorities
		// Typing of the prop will be kept as will be reused by the new priorities feature
		await LivechatRooms.updateMany({ priorityId: { $exists: true } }, { $rename: { priorityId: 'slaId' } });
		if (currentPriorities.length) {
			// Since we updated the typings of the model
			// @ts-expect-error - Types of priorities are incompatible at this point
			await OmnichannelServiceLevelAgreements.insertMany(currentPriorities);
		}

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
