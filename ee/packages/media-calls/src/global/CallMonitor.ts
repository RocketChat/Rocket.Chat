import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { agentManager } from '../agents/Manager';
import { logger } from '../logger';

export class MediaCallMonitor {
	public static async hangupExpiredCalls(): Promise<void> {
		logger.debug('MediaCallMonitor.hangupExpiredCalls');

		const result = MediaCalls.findAllExpiredCalls<Pick<IMediaCall, '_id' | 'caller' | 'callee'>>({
			projection: { _id: 1, caller: 1, callee: 1 },
		});

		for await (const call of result) {
			await agentManager.expireCall(call);
		}
	}

	public static getNewExpirationTime(): Date {
		return new Date(Date.now() + 120000);
	}

	public static async renewCallId(callId: string): Promise<void> {
		await MediaCalls.setExpiresAtById(callId, this.getNewExpirationTime());
	}
}
