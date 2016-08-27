/* globals SyncedCron */

Meteor.startup(() => {
	Meteor.defer(() => {
		console.log('Running the job at:', RocketChat.settings.get('Smarsh_Interval'));
		SyncedCron.add({
			name: 'Smarsh EML Connector',
			schedule: (parser) => parser.text(RocketChat.settings.get('Smarsh_Interval')),
			job: RocketChat.smarsh.generateEml
		});
	});
});
