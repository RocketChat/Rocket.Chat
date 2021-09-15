import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { Logger } from '../../app/logger';

const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history',
});

Meteor.defer(async function() {
	const { oembedCron } = await import('../cron/oembed');
	const { statsCron } = await import('../cron/statistics');
	const { npsCron } = await import('../cron/nps');
	const { federationCron } = await import('../cron/federation');

	oembedCron(SyncedCron);
	statsCron(SyncedCron, logger);
	npsCron(SyncedCron);
	federationCron(SyncedCron);
	SyncedCron.start();
});
