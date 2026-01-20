import * as z from 'zod';

import { IRocketChatRecordSchema, type IRocketChatRecord } from './IRocketChatRecord';

export const DEFAULT_SLA_CONFIG = {
	ESTIMATED_WAITING_TIME_QUEUE: 9999999,
};

export const IOmnichannelServiceLevelAgreementsSchema = IRocketChatRecordSchema.extend({
	name: z.string(),
	description: z.string().optional(),
	dueTimeInMinutes: z.number(),
});

export interface IOmnichannelServiceLevelAgreements extends IRocketChatRecord {
	name: string;
	description?: string;
	dueTimeInMinutes: number;
}
