import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.applySimultaneousChatRestrictions',
	async (_: any, { departmentId }: { departmentId?: string } = {}) => {
		let departmentLimit = 0;
		if (departmentId) {
			departmentLimit =
				(
					await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'maxNumberSimultaneousChat'>>(departmentId, {
						projection: { maxNumberSimultaneousChat: 1 },
					})
				)?.maxNumberSimultaneousChat || 0;
		}

		const ignoreAgentFilterQuery = {
			$or: [
				{
					'livechat.maxNumberSimultaneousChat': { $exists: false },
				},
				{ 'livechat.maxNumberSimultaneousChat': 0 },
				{ 'livechat.maxNumberSimultaneousChat': '' },
				{ 'livechat.maxNumberSimultaneousChat': null },
			],
		};

		const agentFilter = {
			$and: [
				{ 'livechat.maxNumberSimultaneousChat': { $gt: 0 } },
				{ $expr: { $gte: ['$queueInfo.chats', '$livechat.maxNumberSimultaneousChat'] } },
			],
		};

		// Department limit
		// Should apply only when agent filter is not existent
		const departmentFilter =
			departmentLimit > 0
				? {
						$and: [ignoreAgentFilterQuery, { 'queueInfo.chats': { $gte: departmentLimit } }],
					}
				: { _id: '' };

		// apply filter only if agent setting is 0 or is disabled
		const maxChatsPerSetting = settings.get<number>('Livechat_maximum_chats_per_agent');
		const globalFilter =
			maxChatsPerSetting > 0 && departmentLimit === 0
				? {
						$and: [ignoreAgentFilterQuery, { 'queueInfo.chats': { $gte: maxChatsPerSetting } }],
					}
				: // dummy filter meaning: don't match anything
					{ _id: '' };

		return { $match: { $or: [agentFilter, departmentFilter, globalFilter] } };
	},
	callbacks.priority.HIGH,
	'livechat-apply-simultaneous-restrictions',
);
