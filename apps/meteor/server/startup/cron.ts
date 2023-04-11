import { Meteor } from 'meteor/meteor';

import { Logger } from '../../app/logger/server';
import { oembedCron } from '../cron/oembed';
import { statsCron } from '../cron/statistics';
import { npsCron } from '../cron/nps';
import { federationCron } from '../cron/federation';
import { videoConferencesCron } from '../cron/videoConferences';
import { userDataDownloadsCron } from '../cron/userDataDownloads';

const logger = new Logger('SyncedCron');

Meteor.defer(async function () {
	await oembedCron();
	await statsCron(logger);
	await npsCron();
	await federationCron();
	await videoConferencesCron();
	await userDataDownloadsCron();
});
