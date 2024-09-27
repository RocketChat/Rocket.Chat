import { cronJobs } from '@rocket.chat/cron';
import { AirGappedRestriction } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnSettingChangedById } from '../../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../../app/settings/server';
import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { checkAirGappedRestrictions } from './airGappedRestrictionsCheck';

const updateRestrictionSetting = async (remainingDays: number) => {
	const value = settings.get('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days');
	if (value === remainingDays) {
		return;
	}
	await Settings.updateValueById('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', remainingDays);
	void notifyOnSettingChangedById('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days');
};

const sendRocketCatWarningToAdmins = async (remainingDays: number) => {
	const lastDayOrNoRestrictionsAtAll = remainingDays <= 0;
	if (lastDayOrNoRestrictionsAtAll) {
		return;
	}
	if (remainingDays <= AirGappedRestriction.WARNING_PERIOD_IN_DAYS) {
		await sendMessagesToAdmins({
			msgs: async ({ adminUser }) => ({
				msg: i18n.t('AirGapped_Restriction_Warning', { lng: adminUser.language || 'en', remainingDays }),
			}),
		});
	}
};

AirGappedRestriction.on('remainingDays', async ({ days }: { days: number }) => {
	await updateRestrictionSetting(days);
	await sendRocketCatWarningToAdmins(days);
});

Meteor.startup(async () => {
	await cronJobs.add('AirGapped Restrictions Cron', '0 */12 * * *', async () => {
		await checkAirGappedRestrictions();
	});
});
