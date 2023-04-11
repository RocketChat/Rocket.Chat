import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import { checkVersionUpdate } from './functions/checkVersionUpdate';
import './methods/banner_dismiss';
import './addSettings';
import { defaultCronJobs } from '../../utils/server/lib/cron/Cronjobs';

const jobName = 'version_check';

if (await defaultCronJobs.has(jobName)) {
	await defaultCronJobs.remove(jobName);
}

const addVersionCheckJob = async () => {
	await defaultCronJobs.add(jobName, '0 2 * * *', async () => checkVersionUpdate());
};

Meteor.startup(() => {
	Meteor.defer(() => {
		if (settings.get('Update_EnableChecker')) {
			void checkVersionUpdate();
		}
	});
});

settings.watch('Update_EnableChecker', async () => {
	const checkForUpdates = settings.get('Update_EnableChecker');

	if (checkForUpdates && (await defaultCronJobs.has(jobName))) {
		return;
	}

	if (checkForUpdates) {
		await addVersionCheckJob();
		return;
	}

	await defaultCronJobs.remove(jobName);
});
