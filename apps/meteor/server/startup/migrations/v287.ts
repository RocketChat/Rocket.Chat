import { LivechatRooms, Messages, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';
import { BaseRaw } from '../../models/raw/BaseRaw';
import { db } from '../../database/utils';

interface IOldLivechatPriority extends IRocketChatRecord {
	_id: string;
	name: string;
	description: string;
	dueTimeInMinutes: number;
}

class OldLivechatPriorityRaw extends BaseRaw<IOldLivechatPriority> {
	constructor(db: Db) {
		super(db, 'livechat_priority');
	}
}

// Migration to migrate old priorities to new SLAs, plus for new priorities feature
addMigration({
	version: 287,
	async up() {
		const isEE = isEnterprise();

		const OldLivechatPriority = new OldLivechatPriorityRaw(db);
		// CE may have been EE first, so it may hold priorities which we want to remove
		// IF env is not EE anymore, then just cleaning the collection is enough
		// IF it's still EE, populate new collection with SLAs
		const currentPriorities = await OldLivechatPriority.find().toArray();
		await OldLivechatPriority.deleteMany({});

		try {
			// remove indexes from livechat_priority collection
			await OldLivechatPriority.col.dropIndexes();
		} catch (error) {
			// ignore
			console.warn('Error dropping indexes from livechat_priority collection:', error);
		}

		// If there's no priorities, then no rooms/slas should be modified
		if (!isEE) {
			return;
		}

		// Since priorityId holds the "SLA ID" at this point, we need to rename the property so it doesn't conflict with current priorities
		// Typing of the prop will be kept as will be reused by the new priorities feature
		await LivechatRooms.updateMany({ priorityId: { $exists: true } }, { $rename: { priorityId: 'slaId' } });
		if (currentPriorities.length) {
			// Since we updated the typings of the model
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
