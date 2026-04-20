import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { ReadReceipts, ReadReceiptsArchive, Messages } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { sleep } from '../../../lib/utils/sleep';

const logger = new Logger('ReadReceiptsArchive');

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const BATCH_DELAY_MS = 1000; // 1 second delay between batches

export async function archiveOldReadReceipts(): Promise<void> {
	const retentionDays = settings.get<number>('Message_Read_Receipt_Archive_Retention_Days') || 30;
	const batchSize = settings.get<number>('Message_Read_Receipt_Archive_Batch_Size') || 10000;
	const cutoffDate = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

	logger.info({ msg: 'Starting to archive old read receipts', batchSize, cutoffDate });

	let totalProcessed = 0;
	let batchNumber = 0;
	let hasMore = true;

	// eslint-disable-next-line no-await-in-loop
	while (hasMore) {
		batchNumber++;
		logger.info({ msg: 'Processing batch', batchNumber });

		// Find receipts older than the retention period, limited by batch size
		// eslint-disable-next-line no-await-in-loop
		const oldReceipts = await ReadReceipts.findOlderThan(cutoffDate).limit(batchSize).toArray();

		if (oldReceipts.length === 0) {
			logger.info({ msg: 'No more read receipts to archive', totalProcessed });
			break;
		}

		logger.info({ msg: 'Found read receipts in batch', count: oldReceipts.length, batchNumber });

		// Get unique message IDs from the receipts to be archived
		const messageIds = [...new Set(oldReceipts.map((receipt) => receipt.messageId))];

		try {
			// Insert receipts into archive collection (using insertMany with ordered: false to continue on duplicate key errors)
			try {
				// eslint-disable-next-line no-await-in-loop
				await ReadReceiptsArchive.insertMany(oldReceipts, { ordered: false });
				logger.info({ msg: 'Successfully archived read receipts', count: oldReceipts.length, batchNumber });
			} catch (error: unknown) {
				// If we get duplicate key errors, some receipts were already archived, which is fine
				// We'll continue to mark messages and delete from hot storage
				if (error && typeof error === 'object' && ('code' in error || 'writeErrors' in error)) {
					const mongoError = error as {
						code?: number;
						result?: { insertedCount?: number };
						writeErrors?: Array<{ code?: number }>;
					};
					const onlyDuplicateErrors = mongoError.writeErrors?.length
						? mongoError.writeErrors.every((writeError) => writeError.code === 11000)
						: mongoError.code === 11000;

					if (onlyDuplicateErrors) {
						const insertedCount = mongoError.result?.insertedCount || 0;
						logger.info({ msg: 'Archived read receipts (some were already archived)', insertedCount, batchNumber });
					} else {
						throw error;
					}
				} else {
					throw error;
				}
			}

			// Mark messages as having archived receipts
			// eslint-disable-next-line no-await-in-loop
			const updateResult = await Messages.setReceiptsArchivedById(messageIds, true);
			logger.info({ msg: 'Marked messages as having archived receipts', modifiedCount: updateResult.modifiedCount, batchNumber });

			// Delete old receipts from hot storage for this batch
			const receiptIds = oldReceipts.map((receipt) => receipt._id);
			// eslint-disable-next-line no-await-in-loop
			const deleteResult = await ReadReceipts.removeByIds(receiptIds);
			logger.info({ msg: 'Deleted old receipts from hot storage', deletedCount: deleteResult.deletedCount, batchNumber });

			totalProcessed += oldReceipts.length;

			// If we processed a full batch, there might be more, so wait and continue
			if (oldReceipts.length === batchSize) {
				logger.info({ msg: 'Batch complete, waiting before next batch', batchNumber, delayMs: BATCH_DELAY_MS });
				// eslint-disable-next-line no-await-in-loop
				await sleep(BATCH_DELAY_MS);
			} else {
				// This was the last batch (partial batch)
				logger.info({ msg: 'Final batch complete', batchNumber, totalProcessed });
				hasMore = false;
			}
		} catch (error) {
			logger.error({ msg: 'Error during read receipts archiving', batchNumber, err: error });
			throw error;
		}
	}
}

export async function readReceiptsArchiveCron(): Promise<void> {
	const cronSchedule = settings.get<string>('Message_Read_Receipt_Archive_Cron') || '0 2 * * *';

	// Remove existing job if it exists
	if (await cronJobs.has('ReadReceiptsArchive')) {
		await cronJobs.remove('ReadReceiptsArchive');
	}

	if (!settings.get<boolean>('Message_Read_Receipt_Archive_Enabled')) {
		return;
	}

	logger.info({ msg: 'Scheduling read receipts archive cron job', cronSchedule });

	return cronJobs.add('ReadReceiptsArchive', cronSchedule, async () => archiveOldReadReceipts());
}
