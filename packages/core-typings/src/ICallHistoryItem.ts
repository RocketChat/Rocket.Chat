import * as z from 'zod';

import { IMessageSchema } from './IMessage/IMessage';
import { IRocketChatRecordSchema } from './IRocketChatRecord';
import { IRoomSchema } from './IRoom';
import { IUserSchema } from './IUser';
import { serializableDate } from './utils';

export const CallHistoryItemStateSchema = z.union([
	z.literal('ended').meta({ description: 'One of the users ended the call' }),
	z.literal('not-answered').meta({ description: 'Call was not answered' }),
	z.literal('failed').meta({ description: 'The call could not be established' }),
	z.literal('error').meta({ description: 'The call was established, but it ended due to an error' }),
	z.literal('transferred').meta({ description: 'The call ended due to a transfer' }),
]);

export const ICallHistoryItemSchema = IRocketChatRecordSchema.extend({
	uid: IUserSchema.shape._id,
	ts: serializableDate,
	callId: z.string(),
	direction: z.enum(['inbound', 'outbound']),
	state: CallHistoryItemStateSchema,
});

export const IMediaCallHistoryItemSchema = ICallHistoryItemSchema.extend({
	type: z.literal('media-call'),
	external: z.boolean(),

	duration: z.number().meta({ description: "The call's duration, in seconds" }),
	endedAt: serializableDate,
});

export const IInternalMediaCallHistoryItemSchema = IMediaCallHistoryItemSchema.extend({
	external: z.literal(false),
	contactId: IUserSchema.shape._id,
	contactName: IUserSchema.shape.name.optional(),
	contactUsername: IUserSchema.shape.username.optional(),

	rid: IRoomSchema.shape._id.optional(),
	messageId: IMessageSchema.shape._id.optional().meta({ description: 'The ID of the message that was sent after the call ended' }),
});

export const IExternalMediaCallHistoryItemSchema = IMediaCallHistoryItemSchema.extend({
	external: z.literal(true),
	contactExtension: z.string(),
});

export const CallHistoryItemSchema = z.union([IInternalMediaCallHistoryItemSchema, IExternalMediaCallHistoryItemSchema]);

export type CallHistoryItemState = z.infer<typeof CallHistoryItemStateSchema>;

export interface IInternalMediaCallHistoryItem extends z.infer<typeof IInternalMediaCallHistoryItemSchema> {}

export interface IExternalMediaCallHistoryItem extends z.infer<typeof IExternalMediaCallHistoryItemSchema> {}

export type CallHistoryItem = z.infer<typeof CallHistoryItemSchema>;
