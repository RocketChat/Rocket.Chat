import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { agentManager } from '../agents/Manager';
import { logger } from '../logger';

const EXPIRATION_TIME = 120000;
const EXPIRATION_CHECK_DELAY = 1000;

class Monitor {
	public async hangupExpiredCalls(): Promise<void> {
		logger.debug('MediaCallMonitor.hangupExpiredCalls');

		const result = MediaCalls.findAllExpiredCalls<Pick<IMediaCall, '_id' | 'caller' | 'callee'>>({
			projection: { _id: 1, caller: 1, callee: 1 },
		});

		for await (const call of result) {
			await agentManager.expireCall(call);
		}
	}

	public getNewExpirationTime(): Date {
		return new Date(Date.now() + EXPIRATION_TIME);
	}

	public async renewCallId(callId: string): Promise<void> {
		await MediaCalls.setExpiresAtById(callId, this.getNewExpirationTime());
		this.scheduleExpirationCheck();
	}

	public scheduleExpirationCheck(): void {
		setTimeout(
			() => this.hangupExpiredCalls().catch((error) => logger.error({ msg: 'Media Call Monitor failed to hangup expired calls', error })),
			EXPIRATION_TIME + EXPIRATION_CHECK_DELAY,
		);
	}
}

export const MediaCallMonitor = new Monitor();
