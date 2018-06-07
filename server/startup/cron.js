/* global SyncedCron */

const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history'
});

function generateStatistics() {
	const statistics = RocketChat.statistics.save();

	statistics.host = Meteor.absoluteUrl();

	if (RocketChat.settings.get('Statistics_reporting')) {
		try {
			HTTP.post('https://collector.rocket.chat/', {
				data: statistics
			});
		} catch (error) {
			/*error*/
			logger.warn('Failed to send usage report');
		}
	}
}

function cleanupOEmbedCache() {
	return Meteor.call('OEmbedCacheCleanup');
}

function cleanupObsoleteTokens() {
	try {
		RocketChat.models.Users.clearObsoleteTokens();
	} catch (error) {
		console.log(error);
	}
}

function configCleanupTokens() {
	if (RocketChat.settings.get('API_Enable_Obsolete_Cron')) {
		const duration = RocketChat.settings.get('API_Obsolete_Cron').trim() || 'every 12 hours';
		SyncedCron.add({
			name: 'Cleanup Obsolete Tokens',
			schedule(parser) {
				return parser.text(duration);
			},
			job: cleanupObsoleteTokens
		});
	}
}

Meteor.startup(function() {
	return Meteor.defer(function() {
		generateStatistics();

		SyncedCron.add({
			name: 'Generate and save statistics',
			schedule(parser) {
				return parser.cron(`${ new Date().getMinutes() } * * * *`);
			},
			job: generateStatistics
		});

		SyncedCron.add({
			name: 'Cleanup OEmbed cache',
			schedule(parser) {
				const now = new Date();
				return parser.cron(`${ now.getMinutes() } ${ now.getHours() } * * *`);
			},
			job: cleanupOEmbedCache
		});

		configCleanupTokens();

		return SyncedCron.start();
	});
});
