import { log } from 'console';

import { CannedResponse, LivechatPriority, LivechatTag, LivechatUnit } from '@rocket.chat/models';

import { getModules, getTags } from './license';
import { Analytics } from '../../../../server/sdk';

type ENTERPRISE_STATISTICS = {
	modules: string[];
	tags: string[];
	seatRequests: number;
	livechatTags: number;
	cannedResponses: number;
	priorities: number;
	businessUnits: number;
};

export async function getStatistics(): Promise<ENTERPRISE_STATISTICS> {
	const statsPms: Array<Promise<any>> = [];

	const statistics: ENTERPRISE_STATISTICS = {} as any;

	const modules = getModules();
	statistics.modules = modules;

	const tags = getTags().map(({ name }) => name);
	statistics.tags = tags;

	statsPms.push(
		Analytics.getSeatRequestCount().then((count) => {
			statistics.seatRequests = count;
		}),
	);
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
	return statistics;
}
