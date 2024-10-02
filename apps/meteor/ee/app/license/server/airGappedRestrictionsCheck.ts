import { AirGappedRestriction } from '@rocket.chat/license';
import { Statistics } from '@rocket.chat/models';

export async function checkAirGappedRestrictions(): Promise<void> {
	const { statsToken: encryptedStatsToken } = (await Statistics.findLast()) || {};

	await AirGappedRestriction.computeRestriction(encryptedStatsToken);
}
