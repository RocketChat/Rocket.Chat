import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export const DEFAULT_SLA_CONFIG = {
	ESTIMATED_WAITING_TIME_QUEUE: 9999999,
};

export interface IOmnichannelServiceLevelAgreements extends IRocketChatRecord {
	name: string;
	description?: string;
	dueTimeInMinutes: number;
}
