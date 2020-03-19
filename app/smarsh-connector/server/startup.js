import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import _ from 'underscore';

import { smarsh } from './lib/rocketchat';
import { settings } from '../../settings';

const smarshJobName = 'Smarsh EML Connector';

const _addSmarshSyncedCronJob = _.debounce(Meteor.bindEnvironment(function __addSmarshSyncedCronJobDebounced() {
	if (SyncedCron.nextScheduledAtDate(smarshJobName)) {
		SyncedCron.remove(smarshJobName);
	}

	if (settings.get('Smarsh_Enabled') && settings.get('Smarsh_Email') !== '' && settings.get('From_Email') !== '') {
		SyncedCron.add({
			name: smarshJobName,
			schedule: (parser) => parser.text(settings.get('Smarsh_Interval').replace(/_/g, ' ')),
			job: smarsh.generateEml,
		});
	}
}), 500);

Meteor.startup(() => {
	Meteor.defer(() => {
		_addSmarshSyncedCronJob();

		settings.get('Smarsh_Interval', _addSmarshSyncedCronJob);
		settings.get('Smarsh_Enabled', _addSmarshSyncedCronJob);
		settings.get('Smarsh_Email', _addSmarshSyncedCronJob);
		settings.get('From_Email', _addSmarshSyncedCronJob);
	});
});
