import { Meteor } from 'meteor/meteor';

export function oembedCron(SyncedCron) {
	SyncedCron.add({
		name: 'Cleanup OEmbed cache',
		schedule(parser) {
			return parser.cron('24 2 * * *');
		},
		job: () => Meteor.call('OEmbedCacheCleanup'),
	});
}
