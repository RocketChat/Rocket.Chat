import * as z from 'zod';

import { IMessageSchema } from './IMessage/IMessage';
import { IRoomSchema } from './IRoom';
import { IUserSchema } from './IUser';
import { serializableDate } from './utils';

export const IReadReceiptSchema = z.object({
	_id: z.string(),
	token: z.string().optional(),
	messageId: IMessageSchema.shape._id,
	roomId: IRoomSchema.shape._id,
	ts: serializableDate,
	t: IMessageSchema.shape.t.optional(),
	pinned: IMessageSchema.shape.pinned.optional(),
	drid: IMessageSchema.shape.drid.optional(),
	tmid: IMessageSchema.shape._id.optional(),
	userId: IUserSchema.shape._id,
});

export const IReadReceiptWithUserSchema = IReadReceiptSchema.extend({
	user: IUserSchema.pick({ _id: true, name: true, username: true }).optional(),
});

export interface IReadReceipt extends z.infer<typeof IReadReceiptSchema> {}
export interface IReadReceiptWithUser extends z.infer<typeof IReadReceiptWithUserSchema> {}
