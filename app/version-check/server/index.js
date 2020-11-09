import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../settings';
import checkVersionUpdate from './functions/checkVersionUpdate';
import './methods/banner_dismiss';
import './addSettings';

const jobName = 'version_check';

if (SyncedCron.nextScheduledAtDate(jobName)) {
	SyncedCron.remove(jobName);
}

const addVersionCheckJob = Meteor.bindEnvironment(() => {
	SyncedCron.add({
		name: jobName,
		schedule: (parser) => parser.text('at 2:00 am'),
		job() {
			checkVersionUpdate();
		},
	});
});


Meteor.startup(() => {
	Meteor.defer(() => {
		if (settings.get('Register_Server') && settings.get('Update_EnableChecker')) {
			checkVersionUpdate();
		}
	});
});

settings.get(/Register_Server|Update_EnableChecker/, _.debounce(() => {
	const checkForUpdates = settings.get('Register_Server') && settings.get('Update_EnableChecker');

	if (checkForUpdates && SyncedCron.nextScheduledAtDate(jobName)) {
		return;
	}

	if (checkForUpdates) {
		addVersionCheckJob();
		return;
	}

	SyncedCron.remove(jobName);
}, 1000));
