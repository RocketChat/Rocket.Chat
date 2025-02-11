import { Logger } from '@rocket.chat/logger';

import { federationCron } from '../cron/federation';
import { npsCron } from '../cron/nps';
import { oembedCron } from '../cron/oembed';
import { startCron } from '../cron/start';
import { temporaryUploadCleanupCron } from '../cron/temporaryUploadsCleanup';
import { usageReportCron } from '../cron/usageReport';
import { userDataDownloadsCron } from '../cron/userDataDownloads';
import { videoConferencesCron } from '../cron/videoConferences';

const logger = new Logger('SyncedCron');

export const startCronJobs = async (): Promise<void> => {
	await Promise.all([startCron(), oembedCron(), usageReportCron(logger), npsCron(), temporaryUploadCleanupCron(), videoConferencesCron()]);
	federationCron();
	userDataDownloadsCron();
};
