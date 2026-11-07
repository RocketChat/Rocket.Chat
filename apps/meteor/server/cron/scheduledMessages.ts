import { Logger } from '@rocket.chat/logger';
import { Messages, ScheduledMessages } from '@rocket.chat/models';

import { executeSendMessage } from '../meteor-methods/messages/sendMessage';

const logger = new Logger('ScheduledMessagesCron');

const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Recovers stale processing locks from interrupted workers.
 * Transitions already delivered records to 'sent' and undelivered records back to 'pending'.
 */
async function recoverStaleLocks(): Promise<void> {
	const staleThreshold = new Date(Date.now() - STALE_LOCK_TIMEOUT_MS);
	const staleMessages = await ScheduledMessages.find(
		{
			status: 'processing',
			_updatedAt: { $lte: staleThreshold },
		},
		{ projection: { _id: 1 } },
	).toArray();

	if (staleMessages.length === 0) {
		return;
	}

	const staleIds = staleMessages.map((m) => m._id);
	const deliveredMessages = await Messages.find({ _id: { $in: staleIds } }, { projection: { _id: 1 } }).toArray();
	const deliveredIdsSet = new Set(deliveredMessages.map((m) => m._id));

	const alreadyDeliveredIds = staleIds.filter((id) => deliveredIdsSet.has(id));
	const notDeliveredIds = staleIds.filter((id) => !deliveredIdsSet.has(id));

	const now = new Date();
	const updateOperations: Promise<unknown>[] = [];

	if (alreadyDeliveredIds.length > 0) {
		updateOperations.push(
			ScheduledMessages.updateMany(
				{ _id: { $in: alreadyDeliveredIds }, status: 'processing', _updatedAt: { $lte: staleThreshold } },
				{
					$set: {
						status: 'sent',
						sentAt: now,
						_updatedAt: now,
					},
				},
			),
		);
	}

	if (notDeliveredIds.length > 0) {
		updateOperations.push(
			ScheduledMessages.updateMany(
				{ _id: { $in: notDeliveredIds }, status: 'processing', _updatedAt: { $lte: staleThreshold } },
				{
					$set: {
						status: 'pending',
						_updatedAt: now,
					},
				},
			),
		);
	}

	await Promise.all(updateOperations);
}

/**
 * Scans for due scheduled messages, locks them atomically, and delivers them via the message pipeline.
 */
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

			const existingMessage = await Messages.findOneById(message._id, { projection: { _id: 1 } });
			if (!existingMessage) {
				await executeSendMessage(message.u._id, {
					_id: message._id,
					rid: message.rid,
					msg: message.msg,
					groupable: false,
					scheduled: true,
					...(message.tmid && { tmid: message.tmid }),
					...(message.tshow && { tshow: message.tshow }),
				});
			}

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

/**
 * Initializes the background worker for polling and sending scheduled messages.
 */
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
