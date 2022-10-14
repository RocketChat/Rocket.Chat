import { log } from 'console';

import { CannedResponse, LivechatPriority, LivechatTag, LivechatUnit } from '@rocket.chat/models';

import { getModules, getTags, hasLicense } from './license';
import { Analytics } from '../../../../server/sdk';

type ENTERPRISE_STATISTICS = GenericStats & Partial<EEOnlyStats>;

type GenericStats = {
	modules: string[];
	tags: string[];
	seatRequests: number;
};

type EEOnlyStats = {
	livechatTags: number;
	cannedResponses: number;
	priorities: number;
	businessUnits: number;
};

export async function getStatistics(): Promise<ENTERPRISE_STATISTICS> {
	const genericStats: GenericStats = {
		modules: getModules(),
		tags: getTags().map(({ name }) => name),
		seatRequests: await Analytics.getSeatRequestCount(),
	};

	const eeModelsStats = await getEEStatistics();

	const statistics = {
		...genericStats,
		...eeModelsStats,
	};

	return statistics;
}

// These models are only available on EE license so don't import them inside CE license as it will break the build
async function getEEStatistics(): Promise<EEOnlyStats | undefined> {
	if (!hasLicense('livechat-enterprise')) {
		return;
	}

	const statsPms: Array<Promise<any>> = [];

	const statistics: Partial<EEOnlyStats> = {};

	// Number of livechat tags
	statsPms.push(
		LivechatTag.col.count().then((count) => {
			statistics.livechatTags = count;
			return true;
		}),
	);

	// Number of canned responses
	statsPms.push(
		CannedResponse.col.count().then((count) => {
			statistics.cannedResponses = count;
			return true;
		}),
	);

	// Number of Priorities
	statsPms.push(
		LivechatPriority.col.count().then((count) => {
			statistics.priorities = count;
			return true;
		}),
	);

	// Number of business units
	statsPms.push(
		LivechatUnit.find({ type: 'u' })
			.count()
			.then((count) => {
				statistics.businessUnits = count;
				return true;
			}),
	);

	await Promise.all(statsPms).catch(log);

	return statistics as EEOnlyStats;
}
