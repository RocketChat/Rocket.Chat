import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.applySimultaneousChatRestrictions',
	async (_: any, { departmentId }: { departmentId?: string } = {}) => {
		if (departmentId) {
			const departmentLimit =
				(
					await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'maxNumberSimultaneousChat'>>(departmentId, {
						projection: { maxNumberSimultaneousChat: 1 },
					})
				)?.maxNumberSimultaneousChat || 0;
			if (departmentLimit > 0) {
				return { $match: { 'queueInfo.chats': { $gte: Number(departmentLimit) } } };
			}
		}

		const maxChatsPerSetting = settings.get('Livechat_maximum_chats_per_agent') as number;
		const agentFilter = {
			$and: [
				{ 'livechat.maxNumberSimultaneousChat': { $gt: 0 } },
				{ $expr: { $gte: ['queueInfo.chats', 'livechat.maxNumberSimultaneousChat'] } },
			],
		};
		// apply filter only if agent setting is 0 or is disabled
		const globalFilter =
			maxChatsPerSetting > 0
				? {
						$and: [
							{
								$or: [
									{
										'livechat.maxNumberSimultaneousChat': { $exists: false },
									},
									{ 'livechat.maxNumberSimultaneousChat': 0 },
									{ 'livechat.maxNumberSimultaneousChat': '' },
									{ 'livechat.maxNumberSimultaneousChat': null },
								],
							},
							{ 'queueInfo.chats': { $gte: maxChatsPerSetting } },
						],
				  }
				: // dummy filter meaning: don't match anything
				  { _id: '' };

		return { $match: { $or: [agentFilter, globalFilter] } };
	},
	callbacks.priority.HIGH,
	'livechat-apply-simultaneous-restrictions',
);
