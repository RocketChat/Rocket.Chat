import { LivechatPriority, LivechatRooms, Messages, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { IBaseModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';
import { BaseRaw } from '../../models/raw/BaseRaw';
import { db } from '../../database/utils';

interface IOldLivechatPriority extends IRocketChatRecord {
	name: string;
	description: string;
	dueTimeInMinutes: number;
}
interface IOldLivechatPriorityModel extends IBaseModel<IOldLivechatPriority> {
	findOneByIdOrName(_idOrName: string, options?: any): any;
}
class OldLivechatPriorityRaw extends BaseRaw<IOldLivechatPriority> implements IOldLivechatPriorityModel {
	constructor(db: Db) {
		super(db, 'livechat_priority');
	}

	findOneByIdOrName(_idOrName: string, options = {}): any {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}
}

// Migration to migrate old priorities to new SLAs, plus for new priorities feature
addMigration({
	version: 283,
	async up() {
		const isEE = isEnterprise();

		const OldLivechatPriority = new OldLivechatPriorityRaw(db);
		// CE may have been EE first, so it may hold priorities which we want to remove
		// IF env is not EE anymore, then just cleaning the collection is enough
		// IF it's still EE, populate new collection with SLAs
		const currentPriorities = await OldLivechatPriority.find().toArray();
		await OldLivechatPriority.deleteMany({});
		await OldLivechatPriority.col.dropIndexes();
		// If there's no priorities, then no rooms/slas should be modified
		if (!isEE) {
			return;
		}

		// Since priorityId holds the "SLA ID" at this point, we need to rename the property so it doesnt conflict with current priorities
		// Typing of the prop will be kept as will be reused by the new priorities feature
		await LivechatRooms.updateMany({ priorityId: { $exists: true } }, { $rename: { priorityId: 'slaId' } });
		if (currentPriorities.length) {
			// Since we updated the typings of the model
			await OmnichannelServiceLevelAgreements.insertMany(currentPriorities);
		}

		try {
			// remove indexes from livechat_priority collection
			await LivechatPriority.col.dropIndex('dueTimeInMinutes_1');
		} catch (error) {
			// ignore
			console.log('Error dropping index dueTimeInMinutes_1 from livechat_priority collection:', error);
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
