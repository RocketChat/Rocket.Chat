import { Logger } from '@rocket.chat/logger';

import { npsCron } from '../cron/nps';
import { oembedCron } from '../cron/oembed';
import { startCron } from '../cron/start';
import { temporaryUploadCleanupCron } from '../cron/temporaryUploadsCleanup';
import { usageReportCron } from '../cron/usageReport';
import { userDataDownloadsCron } from '../cron/userDataDownloads';
import { videoConferencesCron } from '../cron/videoConferences';
import { scheduledMessagesCron } from '../cron/scheduledMessages';

const logger = new Logger('SyncedCron');

export const startCronJobs = async (): Promise<void> => {
	logger.info('Starting cron jobs...');

	try {
		await startCron();

		await Promise.all([
			oembedCron(),
			usageReportCron(logger),
			npsCron(),
			temporaryUploadCleanupCron(),
			videoConferencesCron(),
			scheduledMessagesCron(logger),
		]);

		logger.info('All cron jobs started successfully');
		userDataDownloadsCron();
	} catch (error) {
		logger.error('Error starting cron jobs:', error);
		throw error;
	}
};
