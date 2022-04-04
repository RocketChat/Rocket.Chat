import { log } from 'console';

import { getModules, getTags } from './license';
import { Analytics } from '../../../../server/sdk';
import { CannedResponseRaw, LivechatPriorityRaw, LivechatTagRaw, LivechatUnitRaw } from '../../models/server';

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
		LivechatTagRaw.col.count().then((count) => {
			statistics.livechatTags = count;
			return true;
		}),
	);

	// Number of canned responses
	statsPms.push(
		CannedResponseRaw.col.count().then((count) => {
			statistics.cannedResponses = count;
			return true;
		}),
	);

	// Number of Priorities
	statsPms.push(
		LivechatPriorityRaw.col.count().then((count) => {
			statistics.priorities = count;
			return true;
		}),
	);

	// Number of business units
	statsPms.push(
		LivechatUnitRaw.col.count().then((count) => {
			statistics.businessUnits = count;
			return true;
		}),
	);

	await Promise.all(statsPms).catch(log);
	return statistics;
}
