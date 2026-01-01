import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';
import { IRoomSchema } from './IRoom';
import { IUserSchema } from './IUser';
import { serializableDate } from './utils';

export const IInviteSchema = IRocketChatRecordSchema.extend({
	days: z.number(),
	maxUses: z.number(),
	rid: IRoomSchema.shape._id,
	userId: IUserSchema.shape._id,
	createdAt: serializableDate,
	expires: serializableDate.nullable(),
	uses: z.number(),
	url: z.string(),
});

export interface IInvite extends z.infer<typeof IInviteSchema> {}
