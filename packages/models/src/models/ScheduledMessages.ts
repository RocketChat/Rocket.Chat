import type { Collection, Db, FindCursor } from 'mongodb';
import type { IScheduledMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { BaseRaw } from './BaseRaw';

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> {
    constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
        // Initializes the MongoDB collection named 'rocketchat_scheduled_message'
        super(db, 'scheduled_message', trash);
    }

    /**
     * Finds all pending scheduled messages that are due for delivery.
     * @returns A MongoDB cursor containing the due messages.
     */
    findDueMessages(): FindCursor<IScheduledMessage> {
        return this.find({
            deliverAt: { $lte: new Date() },
            status: 'pending'
        });
    }

    /**
     * Updates the status of a scheduled message to prevent duplicate processing.
     * @param messageId - The ID of the scheduled message.
     * @param newStatus - The new status to apply (e.g., 'processing', 'sent').
     */
    async updateMessageStatus(messageId: string, newStatus: IScheduledMessage['status']): Promise<boolean> {
        const result = await this.updateOne(
            { _id: messageId },
            { $set: { status: newStatus } }
        );
        return result.modifiedCount > 0;
    }
}