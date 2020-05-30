import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { Logger } from '../../app/logger';
import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics';
import { settings } from '../../app/settings';

const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history',
});

function generateStatistics() {
	const cronStatistics = statistics.save();

	cronStatistics.host = Meteor.absoluteUrl();

	if (settings.get('Statistics_reporting')) {
		try {
			const headers = {};
			const token = getWorkspaceAccessToken();

			if (token) {
				headers.Authorization = `Bearer ${ token }`;
			}

			HTTP.post('https://collector.rocket.chat/', {
				data: cronStatistics,
				headers,
			});
		} catch (error) {
			/* error*/
			logger.warn('Failed to send usage report');
		}
	}
}

function cleanupOEmbedCache() {
	return Meteor.call('OEmbedCacheCleanup');
}

const name = 'Generate and save statistics';

Meteor.startup(function() {
	return Meteor.defer(function() {
		let TroubleshootDisableStatisticsGenerator;
		settings.get('Troubleshoot_Disable_Statistics_Generator', (key, value) => {
			if (TroubleshootDisableStatisticsGenerator === value) { return; }
			TroubleshootDisableStatisticsGenerator = value;

			if (value) {
				return SyncedCron.remove(name);
			}

			generateStatistics();

			SyncedCron.add({
				name,
				schedule(parser) {
					return parser.cron('12 * * * *');
				},
				job: generateStatistics,
			});
		});

		SyncedCron.add({
			name: 'Cleanup OEmbed cache',
			schedule(parser) {
				return parser.cron('24 2 * * *');
			},
			job: cleanupOEmbedCache,
		});

		return SyncedCron.start();
	});
});
