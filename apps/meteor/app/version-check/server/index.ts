import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../settings/server';
import { checkVersionUpdate } from './functions/checkVersionUpdate';
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
			Promise.await(checkVersionUpdate());
		},
	});
});

Meteor.startup(() => {
	Meteor.defer(() => {
		if (settings.get('Update_EnableChecker')) {
			Promise.await(checkVersionUpdate());
		}
	});
});

settings.watch('Update_EnableChecker', () => {
	const checkForUpdates = settings.get('Update_EnableChecker');

	if (checkForUpdates && SyncedCron.nextScheduledAtDate(jobName)) {
		return;
	}

	if (checkForUpdates) {
		addVersionCheckJob();
		return;
	}

	SyncedCron.remove(jobName);
});
