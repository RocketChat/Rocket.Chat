import { License, AirGappedRestriction } from '@rocket.chat/license';
import { Statistics } from '@rocket.chat/models';

export async function checkAirGappedRestrictions(): Promise<void> {
	if (License.hasModule('unlimited-presence')) {
		AirGappedRestriction.removeRestrictions();
		return;
	}

	const { statsToken: encryptedStatsToken } = (await Statistics.findLast()) || {};
	if (!encryptedStatsToken) {
		return AirGappedRestriction.applyRestrictions();
	}

	await AirGappedRestriction.checkRemainingDaysSinceLastStatsReport(encryptedStatsToken);
}
