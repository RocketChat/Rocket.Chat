import type { IMessage, IScheduledMessage, IUser, ScheduledMessageEditableFields } from '@rocket.chat/core-typings';

export type ScheduledMessageCreateParams = Pick<IScheduledMessage, 'rid' | 'msg' | 'scheduledAt' | 'tmid' | 'tshow' | 'files'>;

export interface IScheduledMessageService {
	create(uid: IUser['_id'], params: ScheduledMessageCreateParams): Promise<IScheduledMessage>;
	list(
		uid: IUser['_id'],
		params: { rid?: string; offset: number; count: number },
	): Promise<{ scheduledMessages: IScheduledMessage[]; total: number }>;
	update(
		uid: IUser['_id'],
		scheduledMessageId: IScheduledMessage['_id'],
		params: ScheduledMessageEditableFields,
	): Promise<IScheduledMessage>;
	delete(uid: IUser['_id'], scheduledMessageId: IScheduledMessage['_id']): Promise<void>;
	sendNow(uid: IUser['_id'], scheduledMessageId: IScheduledMessage['_id']): Promise<IMessage>;
	scheduleNext(): Promise<void>;
}
