import { IMessage } from './IMessage';
import type { IUser } from './IUser';

/**
 * Represents a message that has been queued for future delivery.
 */
export interface IScheduledMessage extends IMessage {
    /**
     * The exact date and time when the message is scheduled to be delivered.
     */
    deliverAt: Date;

    /**
     * The user who originally scheduled the message.
     * (Often the same as `sender`, but kept explicit for auditing).
     */
    scheduledBy: IUser;

    /**
     * The current processing status of the scheduled message.
     */
    status: 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';

    /**
     * Optional: Any error message if delivery fails.
     */
    errorReason?: string;
}