import { IRoomSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

export * from './dm';
export * from './im';
export * from './DmCreateProps';
export * from './DmFileProps';
export * from './DmMembersProps';
export * from './DmMessagesProps';

export const POSTDMDeleteBodySchema = z.union([z.object({ roomId: IRoomSchema.shape._id }), z.object({ username: z.string() })]);
