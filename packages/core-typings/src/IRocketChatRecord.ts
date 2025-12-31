import type { WithId } from 'mongodb';
import * as z from 'zod';

import { serializableDate } from './utils';

export const IRocketChatRecordSchema = z.object({
	_id: z.string(),
	_updatedAt: serializableDate,
});

export interface IRocketChatRecord extends z.infer<typeof IRocketChatRecordSchema> {}

export type RocketChatRecordDeleted<T> = WithId<T> & {
	_updatedAt: Date;
	_deletedAt: Date;
	__collection__: string;
};
