import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../settings/server';
import { checkVersionUpdate } from './functions/checkVersionUpdate';
import './methods/banner_dismiss';

const jobName = 'version_check';

if (SyncedCron.nextScheduledAtDate(jobName)) {
	SyncedCron.remove(jobName);
}

const addVersionCheckJob = () => {
	SyncedCron.add({
		name: jobName,
		schedule: (parser) => parser.text('at 2:00 am'),
		async job() {
			await checkVersionUpdate();
		},
	});
};

Meteor.startup(() => {
	setImmediate(() => {
		if (settings.get('Update_EnableChecker')) {
			void checkVersionUpdate();
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
