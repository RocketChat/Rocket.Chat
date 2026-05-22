import { Users } from '@rocket.chat/models';

import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { settings } from '../../../settings/server';

type LockResult = {
	acquired: boolean;
	required: boolean;
	unlock: () => Promise<void>;
};

export async function conditionalLockAgent(agentId: string): Promise<LockResult> {
	// Lock and chats limits enforcement are only required when waiting_queue is enabled and the agent is not a bot
	const shouldLock = settings.get<boolean>('Livechat_waiting_queue');

	if (!shouldLock || (await hasRoleAsync(agentId, 'bot'))) {
		return {
			acquired: false,
			required: false,
			unlock: async () => {
				// no-op
			},
		};
	}

	const lockTime = new Date();
	const lockAcquired = await Users.acquireAgentLock(agentId, lockTime);

	return {
		acquired: !!lockAcquired,
		required: true,
		unlock: async () => {
			await Users.releaseAgentLock(agentId, lockTime);
		},
	};
}
