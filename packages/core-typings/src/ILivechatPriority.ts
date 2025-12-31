import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';

export enum LivechatPriorityWeight {
	LOWEST = 5,
	LOW = 4,
	MEDIUM = 3,
	HIGH = 2,
	HIGHEST = 1,
	NOT_SPECIFIED = 99,
}

export const ILivechatPrioritySchema = IRocketChatRecordSchema.extend({
	name: z.string().optional(),
	i18n: z.string(),
	sortItem: z.enum(LivechatPriorityWeight),
	dirty: z.boolean(), // Whether the priority has been modified by the user or not
});

export interface ILivechatPriority extends z.infer<typeof ILivechatPrioritySchema> {}

export type ILivechatPriorityData = Omit<ILivechatPriority, '_id' | '_updatedAt'>;
