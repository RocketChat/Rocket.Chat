import { cronJobs } from '@rocket.chat/cron';
import { AirGappedRestriction } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { checkAirGappedRestrictions } from './airGappedRestrictionsCheck';

AirGappedRestriction.on('remainingDays', ({ days }: { days: number }) =>
	Settings.updateValueById('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', days),
);

Meteor.startup(async () => {
	await cronJobs.add('AirGapped Restrictions Cron', '0 */12 * * *', async () => {
		await checkAirGappedRestrictions();
	});
});
