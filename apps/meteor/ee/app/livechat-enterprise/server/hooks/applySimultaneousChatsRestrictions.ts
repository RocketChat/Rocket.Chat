import type { ILivechatDepartment, AvailableAgentsAggregation } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

export async function getChatLimitsQuery(departmentId?: string): Promise<Filter<AvailableAgentsAggregation>> {
	const limitFilter: Filter<AvailableAgentsAggregation> = [];

	if (departmentId) {
		const departmentLimit =
			(
				await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'maxNumberSimultaneousChat'>>(departmentId, {
					projection: { maxNumberSimultaneousChat: 1 },
				})
			)?.maxNumberSimultaneousChat || 0;
		if (departmentLimit > 0) {
			limitFilter.push({ 'queueInfo.chatsForDepartment': { $gte: Number(departmentLimit) } });
		}
	}

	limitFilter.push({
		$and: [{ maxChatsForAgent: { $gt: 0 } }, { $expr: { $gte: ['$queueInfo.chats', '$maxChatsForAgent'] } }],
	});

	const maxChatsPerSetting = settings.get<number>('Livechat_maximum_chats_per_agent');
	if (maxChatsPerSetting > 0) {
		limitFilter.push({
			$and: [{ maxChatsForAgent: { $eq: 0 } }, { 'queueInfo.chats': { $gte: maxChatsPerSetting } }],
		});
	}

	return { $match: { $or: limitFilter } };
}

callbacks.add(
	'livechat.applySimultaneousChatRestrictions',
	async (_: any, { departmentId }: { departmentId?: string } = {}) => {
		return getChatLimitsQuery(departmentId);
	},
	callbacks.priority.HIGH,
	'livechat-apply-simultaneous-restrictions',
);
