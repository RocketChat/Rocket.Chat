/* globals SyncedCron */

import checkVersionUpdate from './functions/checkVersionUpdate';
import './methods/banner_dismiss';
import './addSettings';

const jobName = 'version_check';

if (SyncedCron.nextScheduledAtDate(jobName)) {
	SyncedCron.remove(jobName);
}

SyncedCron.add({
	name: jobName,
	schedule: parser => parser.text('at 2:00 am'),
	job() {
		checkVersionUpdate();
	}
});

SyncedCron.start();

Meteor.startup(() => {
	checkVersionUpdate();
});

// Send email to admins
// Save latest alert
// ENV var to disable the check for update for our cloud
