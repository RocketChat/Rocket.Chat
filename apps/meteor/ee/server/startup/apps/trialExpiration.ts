import { SyncedCron } from 'meteor/littledata:synced-cron';
import type { ILicense } from '@rocket.chat/core-typings';

import { flatModules, getLicenses } from '../../../app/license/server/license';

function isTrialLicenseJustExpired(_license: ILicense) {
	throw new Error('Not implemented');
}

function markNewExpiredTrialLicenses() {
	throw new Error('Not implemented');
}

function disableAllApps() {
	throw new Error('Not implemented');
}

async function checkIfAnyTrialLicenseJustExpired() {
	const licenses = getLicenses()
		.filter(({ valid }) => valid)
		.map(({ license }) => ({
			...license,
			modules: flatModules(license.modules),
		}));

	const hasValidLicense = licenses.some((license) => license.modules.length > 0) ?? false;

	if (hasValidLicense) {
		return;
	}

	const trialLicenses = licenses.filter((license) => license.meta?.trial ?? false);

	const justExpiredTrialLicenses = trialLicenses.filter(isTrialLicenseJustExpired);

	if (justExpiredTrialLicenses.length === 0) {
		return;
	}

	markNewExpiredTrialLicenses();
	disableAllApps();
}

SyncedCron.add({
	name: 'Apps:trialLicenseExpiration',
	schedule: (parser) => parser.text('every 12 hours'),
	job: checkIfAnyTrialLicenseJustExpired,
});
