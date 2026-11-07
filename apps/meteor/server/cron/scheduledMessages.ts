import { Logger } from '@rocket.chat/logger';
import { ScheduledMessages } from '@rocket.chat/models';

import { executeSendMessage } from '../meteor-methods/messages/sendMessage';

const logger = new Logger('ScheduledMessagesCron');

const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

async function recoverStaleLocks(): Promise<void> {
	const staleThreshold = new Date(Date.now() - STALE_LOCK_TIMEOUT_MS);
	await ScheduledMessages.updateMany(
		{
			status: 'processing',
			_updatedAt: { $lte: staleThreshold },
		},
		{
			$set: {
				status: 'pending',
				_updatedAt: new Date(),
			},
		},
	);
}

async function processScheduledMessages(): Promise<void> {
	logger.debug('Checking for due scheduled messages');

	await recoverStaleLocks();

	const dueMessages = await ScheduledMessages.findDueMessages().toArray();
	if (dueMessages.length === 0) {
		return;
	}

	logger.info(`Found ${dueMessages.length} scheduled message(s) to send.`);

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
				msg: message.msg,
				groupable: false,
				scheduled: true,
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

			logger.info(`Message ${message._id} sent successfully.`);
		} catch (error: any) {
			logger.error({
				msg: `Failed to send message ${message._id}`,
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
	processScheduledMessages().catch((error) => {
		logger.error({ msg: 'Error running initial scheduled messages process', err: error });
	});

	setInterval(() => {
		processScheduledMessages().catch((error) => {
			logger.error({ msg: 'Error running scheduled messages interval', err: error });
		});
	}, 20000);
}
