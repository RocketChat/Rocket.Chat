import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type ScheduledMessageStatus = 'scheduled' | 'sending' | 'sent' | 'failed';

export interface IScheduledMessage extends IRocketChatRecord {
	uid: IUser['_id'];
	rid: IRoom['_id'];
	msg: string;

	/** When the message should be delivered. */
	scheduledAt: Date;
	createdAt: Date;
	updatedAt: Date;

	status: ScheduledMessageStatus;

	/**
	 * Position this message occupies in its author's quota, always below
	 * `Message_MaxScheduledMessagesPerUser`. A unique partial index on `uid`+`slot` makes the quota a
	 * database invariant rather than something concurrent requests can race past.
	 */
	slot: number;

	/** Identifies the dispatcher run currently delivering this message, while `status` is `sending`. */
	claimId?: string;
	/** When the current delivery claim was taken, so claims left behind by a dead instance can be requeued. */
	claimedAt?: Date;

	/** Thread the message belongs to, if any. */
	tmid?: IMessage['_id'];
	/** Whether the threaded message should also show in the channel. */
	tshow?: boolean;

	/** `_id` of the message created once the scheduled message was delivered. */
	messageId?: IMessage['_id'];
	/** Reason of the last delivery failure, when `status` is `failed`. */
	error?: string;
}
