import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.applySimultaneousChatRestrictions',
	async (_: any, { departmentId }: { departmentId?: string } = {}) => {
		const limitFilter: any = [];

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
			$and: [
				{ $expr: { $gt: [{ $convert: { input: '$livechat.maxNumberSimultaneousChat', to: 'double', onError: 0, onNull: 0 } }, 50] } },
				// { 'livechat.maxNumberSimultaneousChat': { $gt: 0 } },
				{ $expr: { $gte: ['queueInfo.chats', 'livechat.maxNumberSimultaneousChat'] } },
			],
		});

		const maxChatsPerSetting = settings.get<number>('Livechat_maximum_chats_per_agent');
		if (maxChatsPerSetting > 0) {
			limitFilter.push({
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
			});
		}

		return { $match: { $or: limitFilter } };
	},
	callbacks.priority.HIGH,
	'livechat-apply-simultaneous-restrictions',
);
