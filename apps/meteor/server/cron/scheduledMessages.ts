import { Logger } from '@rocket.chat/logger';
import { cronJobs } from '@rocket.chat/cron';
import { ScheduledMessages } from '@rocket.chat/models';

import { executeSendMessage } from '../meteor-methods/messages/sendMessage';

const logger = new Logger('ScheduledMessagesCron');

async function processScheduledMessages(): Promise<void> {
    logger.info('[ScheduledMessagesCron] Tick: Checking for due messages...');

    // 1. Direct MongoDB query to guarantee we find messages properly (bypasses any model bugs)
    const dueMessages = await ScheduledMessages.find({
        status: 'pending',
        deliverAt: { $lte: new Date() }
    }).toArray();

    if (dueMessages.length === 0) {
        logger.info('[ScheduledMessagesCron] No due messages found right now.');
        return;
    }

    logger.info(`[ScheduledMessagesCron] Found ${dueMessages.length} scheduled message(s) to send.`);

    for (const message of dueMessages) {
        try {
            const locked = await ScheduledMessages.updateOne(
                { _id: message._id, status: 'pending' },
                { $set: { status: 'processing', _updatedAt: new Date() } },
            );

            if (locked.modifiedCount === 0) {
                continue; 
            }


            await executeSendMessage(message.u._id, {
                rid: message.rid,
                // Loophole fix: Add a scheduled tag so no one can fake the time
                msg: `${message.msg} \n\n_*(Scheduled Message)*_`,
                groupable: false,
                ...(message.tmid && { tmid: message.tmid }),
                ...(message.tshow && { tshow: message.tshow }),
            });

            await ScheduledMessages.updateOne(
                { _id: message._id },
                {
                    $set: {
                        status: 'sent',
                        sentAt: new Date(),
                        _updatedAt: new Date(),
                    },
                },
            );

            logger.info(`[ScheduledMessagesCron] Message ${message._id} sent successfully.`);
        } catch (error: any) {
            logger.error({
                msg: `[ScheduledMessagesCron] Failed to send message ${message._id}`,
                err: error,
            });

            await ScheduledMessages.updateOne(
                { _id: message._id },
                {
                    $set: {
                        status: 'failed',
                        errorReason: error?.message || 'Unknown delivery failure',
                        _updatedAt: new Date(),
                    },
                },
            );
        }
    }
}

export async function scheduledMessagesCron(): Promise<void> {
    // 2. Force immediate run on startup
    void processScheduledMessages();


    setInterval(() => {
        void processScheduledMessages();
    }, 20000);

    // 4. Keep standard cron registration for production standards
    return cronJobs.add('Process scheduled messages', '* * * * *', async () => processScheduledMessages());
}