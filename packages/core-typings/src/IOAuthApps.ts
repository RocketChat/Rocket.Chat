import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';
import { serializableDate } from './utils';

export const IOAuthAppsSchema = IRocketChatRecordSchema.extend({
	name: z.string(),
	active: z.boolean(),
	clientId: z.string(),
	clientSecret: z.string().optional(),
	redirectUri: z.string(),
	_createdAt: serializableDate,
	_createdBy: z.object({
		_id: z.string(),
		username: z.string(),
	}),
	appId: z.string().optional(),
});

export interface IOAuthApps extends z.infer<typeof IOAuthAppsSchema> {}
