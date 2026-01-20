import { Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

type LockResult = {
	acquired: boolean;
	required: boolean;
	unlock: () => Promise<void>;
};

export async function conditionalLockAgent(agentId: string, lockTime: Date): Promise<LockResult> {
	// Lock and chats limits enforcement are only required when waiting_queue is enabled
	const shouldLock = settings.get<boolean>('Livechat_waiting_queue');

	if (!shouldLock) {
		return {
			acquired: false,
			required: false,
			unlock: async () => {
				// no-op
			},
		};
	}

	const lockAcquired = await Users.acquireAgentLock(agentId, lockTime);

	return {
		acquired: !!lockAcquired,
		required: true,
		unlock: async () => {
			await Users.releaseAgentLock(agentId, lockTime);
		},
	};
}
