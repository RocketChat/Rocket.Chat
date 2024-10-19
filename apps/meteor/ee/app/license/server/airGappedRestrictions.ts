import { AirGappedRestriction, License } from '@rocket.chat/license';
import { Settings, Statistics } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../../app/lib/server/lib/notifyListener';
import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';

const updateRestrictionSetting = async (remainingDays: number) => {
	await Settings.updateValueById('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', remainingDays);
	void notifyOnSettingChangedById('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days');
};

const sendRocketCatWarningToAdmins = async (remainingDays: number) => {
	const lastDayOrNoRestrictionsAtAll = remainingDays <= 0;
	if (lastDayOrNoRestrictionsAtAll) {
		return;
	}
	if (AirGappedRestriction.isWarningPeriod(remainingDays)) {
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

License.onValidateLicense(async () => {
	const token = await Statistics.findLastStatsToken();
	void AirGappedRestriction.computeRestriction(token);
});

License.onRemoveLicense(async () => {
	const token = await Statistics.findLastStatsToken();
	void AirGappedRestriction.computeRestriction(token);
});
