import { cronJobs } from '@rocket.chat/cron';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { checkVersionUpdate } from './functions/checkVersionUpdate';
import './methods/banner_dismiss';

const jobName = 'version_check';

if (await cronJobs.has(jobName)) {
	await cronJobs.remove(jobName);
}

const addVersionCheckJob = async () => {
	await cronJobs.add(jobName, '0 2 * * *', async () => checkVersionUpdate());
};

Meteor.startup(() => {
	setImmediate(() => {
		if (settings.get('Update_EnableChecker')) {
			void checkVersionUpdate();
		}
	});
});

settings.watch('Update_EnableChecker', async () => {
	const checkForUpdates = settings.get('Update_EnableChecker');

	if (checkForUpdates && (await cronJobs.has(jobName))) {
		return;
	}

	if (checkForUpdates) {
		await addVersionCheckJob();
		return;
	}

	await cronJobs.remove(jobName);
});
