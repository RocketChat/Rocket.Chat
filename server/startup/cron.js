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

		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'daily') {
			SyncedCron.add({
				name: 'Send password change log for admins by email - daily',
				schedule(parser) {
					return parser.text('at 0:00 am every 1 day');
				},
				job() {
					Meteor.call('sendPasswordChangeHistoryForAdmins');
				}
			});
		}

		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'weekly') {
			SyncedCron.add({
				name: 'Send password change log for admins by email - weekly',
				schedule(parser) {
					return parser.text('on the first day of the week');
				},
				job() {
					Meteor.call('sendPasswordChangeHistoryForAdmins');
				}
			});
		}

		return SyncedCron.start();
	});
});
