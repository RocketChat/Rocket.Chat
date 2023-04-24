import { SyncedCron } from 'meteor/littledata:synced-cron';

async function checkIfTrialLicenseWasExpired() {
	// TODO
}

SyncedCron.add({
	name: 'Apps:trialLicenseExpiration',
	schedule: (parser) => parser.text('every 12 hours'),
	job: checkIfTrialLicenseWasExpired,
});
