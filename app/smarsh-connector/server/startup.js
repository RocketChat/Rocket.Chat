import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import _ from 'underscore';

import { smarsh } from './lib/rocketchat';
import { SettingsVersion4 } from '../../settings/server';

const smarshJobName = 'Smarsh EML Connector';

const _addSmarshSyncedCronJob = _.debounce(Meteor.bindEnvironment(function __addSmarshSyncedCronJobDebounced() {
	if (SyncedCron.nextScheduledAtDate(smarshJobName)) {
		SyncedCron.remove(smarshJobName);
	}

	if (SettingsVersion4.get('Smarsh_Enabled') && SettingsVersion4.get('Smarsh_Email') !== '' && SettingsVersion4.get('From_Email') !== '') {
		SyncedCron.add({
			name: smarshJobName,
			schedule: (parser) => parser.text(SettingsVersion4.get('Smarsh_Interval').replace(/_/g, ' ')),
			job: smarsh.generateEml,
		});
	}
}), 500);

Meteor.startup(() => {
	_addSmarshSyncedCronJob();

	SettingsVersion4.watchMultiple(['Smarsh_Enabled', 'Smarsh_Email', 'From_Email', 'Smarsh_Interval'], _addSmarshSyncedCronJob);
});
