import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { ReadReceipts, ReadReceiptsArchive, Messages } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';

const logger = new Logger('ReadReceiptsArchive');

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export async function archiveOldReadReceipts(): Promise<void> {
	const retentionDays = settings.get<number>('Message_Read_Receipt_Archive_Retention_Days') || 30;
	const cutoffDate = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

	logger.info(`Starting to archive read receipts older than ${cutoffDate.toISOString()}`);

	// Find all receipts older than the retention period
	const oldReceipts = await ReadReceipts.findOlderThan(cutoffDate).toArray();

	if (oldReceipts.length === 0) {
		logger.info('No read receipts to archive');
		return;
	}

	logger.info(`Found ${oldReceipts.length} read receipts to archive`);

	// Get unique message IDs from the receipts to be archived
	const messageIds = [...new Set(oldReceipts.map((receipt) => receipt.messageId))];

	try {
		// Insert receipts into archive collection (using insertMany with ordered: false to continue on duplicate key errors)
		if (oldReceipts.length > 0) {
			try {
				await ReadReceiptsArchive.insertMany(oldReceipts, { ordered: false });
				logger.info(`Successfully archived ${oldReceipts.length} read receipts`);
			} catch (error: unknown) {
				// If we get duplicate key errors, some receipts were already archived, which is fine
				// We'll continue to mark messages and delete from hot storage
				if (error && typeof error === 'object' && ('code' in error || 'name' in error)) {
					const mongoError = error as { code?: number; name?: string; result?: { insertedCount?: number } };
					if (mongoError.code === 11000 || mongoError.name === 'MongoBulkWriteError') {
						const insertedCount = mongoError.result?.insertedCount || 0;
						logger.info(`Archived ${insertedCount} read receipts (some were already archived)`);
					} else {
						throw error;
					}
				} else {
					throw error;
				}
			}
		}

		// Mark messages as having archived receipts
		const updateResult = await Messages.updateMany({ _id: { $in: messageIds } }, { $set: { receiptsArchived: true } });
		logger.info(`Marked ${updateResult.modifiedCount} messages as having archived receipts`);

		// Delete old receipts from hot storage
		const deleteResult = await ReadReceipts.deleteMany({ ts: { $lt: cutoffDate } });
		logger.info(`Deleted ${deleteResult.deletedCount} old receipts from hot storage`);
	} catch (error) {
		logger.error(`Error during read receipts archiving: ${error}`);
		throw error;
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
