import { Logger } from '@rocket.chat/logger';
import { Meteor } from 'meteor/meteor';

import { federationCron } from '../cron/federation';
import { npsCron } from '../cron/nps';
import { oembedCron } from '../cron/oembed';
import { startCron } from '../cron/start';
import { statsCron } from '../cron/statistics';
import { userDataDownloadsCron } from '../cron/userDataDownloads';
import { videoConferencesCron } from '../cron/videoConferences';

const logger = new Logger('SyncedCron');

Meteor.defer(async () => {
	await startCron();

	await oembedCron();
	await statsCron(logger);
	await npsCron();
	await federationCron();
	await videoConferencesCron();
	await userDataDownloadsCron();
});
