import { callbacks } from '../../../../../lib/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.applySimultaneousChatRestrictions',
	(_: any, { departmentId }: { departmentId?: string } = {}) => {
		if (departmentId) {
			const departmentLimit = LivechatDepartment.findOneById(departmentId)?.maxNumberSimultaneousChat || 0;
			if (departmentLimit > 0) {
				cbLogger.debug(`Applying department filters. Max chats per department ${departmentLimit}`);
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

		cbLogger.debug(`Applying agent & global filters. Max number of chats allowed to all agents by setting: ${maxChatsPerSetting}`);

		return { $match: { $or: [agentFilter, globalFilter] } };
	},
	callbacks.priority.HIGH,
	'livechat-apply-simultaneous-restrictions',
);
