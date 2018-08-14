/* globals SyncedCron */
import _ from 'underscore';

const smarshJobName = 'Smarsh EML Connector';

const _addSmarshSyncedCronJob = _.debounce(Meteor.bindEnvironment(function __addSmarshSyncedCronJobDebounced() {
	if (SyncedCron.nextScheduledAtDate(smarshJobName)) {
		SyncedCron.remove(smarshJobName);
	}

	if (RocketChat.settings.get('Smarsh_Enabled') && RocketChat.settings.get('Smarsh_Email') !== '' && RocketChat.settings.get('From_Email') !== '') {
		SyncedCron.add({
			name: smarshJobName,
			schedule: (parser) => parser.text(RocketChat.settings.get('Smarsh_Interval').replace(/_/g, ' ')),
			job: RocketChat.smarsh.generateEml
		});
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		_addSmarshSyncedCronJob();

		RocketChat.settings.get('Smarsh_Interval', _addSmarshSyncedCronJob);
		RocketChat.settings.get('Smarsh_Enabled', _addSmarshSyncedCronJob);
		RocketChat.settings.get('Smarsh_Email', _addSmarshSyncedCronJob);
		RocketChat.settings.get('From_Email', _addSmarshSyncedCronJob);
	});
});
