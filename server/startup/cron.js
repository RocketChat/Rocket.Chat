import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { Logger } from '../../app/logger';
import { oembedCron } from '../cron/oembed';
import { statsCron } from '../cron/statistics';
import { npsCron } from '../cron/nps';
import { federationCron } from '../cron/federation';

const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history',
});

Meteor.defer(function () {
	oembedCron(SyncedCron);
	statsCron(SyncedCron, logger);
	npsCron(SyncedCron);
	federationCron(SyncedCron);

	SyncedCron.start();
});
