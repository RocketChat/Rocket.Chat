import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { ReadReceipts, ReadReceiptsArchive, Messages } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';

const logger = new Logger('ReadReceiptsArchive');

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const BATCH_DELAY_MS = 1000; // 1 second delay between batches

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function archiveOldReadReceipts(): Promise<void> {
	const retentionDays = settings.get<number>('Message_Read_Receipt_Archive_Retention_Days') || 30;
	const batchSize = settings.get<number>('Message_Read_Receipt_Archive_Batch_Size') || 10000;
	const cutoffDate = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

	logger.info(`Starting to archive read receipts older than ${cutoffDate.toISOString()}, batch size: ${batchSize}`);

	let totalProcessed = 0;
	let batchNumber = 0;

	while (true) {
		batchNumber++;
		logger.info(`Processing batch ${batchNumber}...`);

		// Find receipts older than the retention period, limited by batch size
		const oldReceipts = await ReadReceipts.findOlderThan(cutoffDate).limit(batchSize).toArray();

		if (oldReceipts.length === 0) {
			logger.info(`No more read receipts to archive. Total processed: ${totalProcessed}`);
			break;
		}

		logger.info(`Found ${oldReceipts.length} read receipts in batch ${batchNumber}`);

		// Get unique message IDs from the receipts to be archived
		const messageIds = [...new Set(oldReceipts.map((receipt) => receipt.messageId))];

		try {
			// Insert receipts into archive collection (using insertMany with ordered: false to continue on duplicate key errors)
			try {
				await ReadReceiptsArchive.insertMany(oldReceipts, { ordered: false });
				logger.info(`Successfully archived ${oldReceipts.length} read receipts in batch ${batchNumber}`);
			} catch (error: unknown) {
				// If we get duplicate key errors, some receipts were already archived, which is fine
				// We'll continue to mark messages and delete from hot storage
				if (error && typeof error === 'object' && ('code' in error || 'name' in error)) {
					const mongoError = error as { code?: number; name?: string; result?: { insertedCount?: number } };
					if (mongoError.code === 11000 || mongoError.name === 'MongoBulkWriteError') {
						const insertedCount = mongoError.result?.insertedCount || 0;
						logger.info(`Archived ${insertedCount} read receipts in batch ${batchNumber} (some were already archived)`);
					} else {
						throw error;
					}
				} else {
					throw error;
				}
			}

			// Mark messages as having archived receipts
			const updateResult = await Messages.updateMany({ _id: { $in: messageIds } }, { $set: { receiptsArchived: true } });
			logger.info(`Marked ${updateResult.modifiedCount} messages as having archived receipts in batch ${batchNumber}`);

			// Delete old receipts from hot storage for this batch
			const receiptIds = oldReceipts.map((receipt) => receipt._id);
			const deleteResult = await ReadReceipts.deleteMany({ _id: { $in: receiptIds } });
			logger.info(`Deleted ${deleteResult.deletedCount} old receipts from hot storage in batch ${batchNumber}`);

			totalProcessed += oldReceipts.length;

			// If we processed a full batch, there might be more, so wait and continue
			if (oldReceipts.length === batchSize) {
				logger.info(`Batch ${batchNumber} complete. Waiting ${BATCH_DELAY_MS}ms before next batch...`);
				await sleep(BATCH_DELAY_MS);
			} else {
				// This was the last batch (partial batch)
				logger.info(`Final batch ${batchNumber} complete. Total processed: ${totalProcessed}`);
				break;
			}
		} catch (error) {
			logger.error(`Error during read receipts archiving in batch ${batchNumber}: ${error}`);
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

	return cronJobs.add('ReadReceiptsArchive', cronSchedule, async () => archiveOldReadReceipts());
}
