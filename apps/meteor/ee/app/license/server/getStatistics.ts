import { log } from 'console';

import { Analytics } from '@rocket.chat/core-services';
import { CannedResponse, OmnichannelServiceLevelAgreements, LivechatRooms, LivechatTag, LivechatUnit, Users } from '@rocket.chat/models';

import { getModules, getTags, hasLicense } from './license';

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
	slas: number;
	businessUnits: number;
	omnichannelPdfTranscriptRequested: number;
	omnichannelPdfTranscriptSucceeded: number;
	omnichannelRoomsWithSlas: number;
	omnichannelRoomsWithPriorities: number;
	livechatMonitors: number;
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
		CannedResponse.col.estimatedDocumentCount().then((count) => {
			statistics.cannedResponses = count;
			return true;
		}),
	);

	// Number of Service Level Agreements
	statsPms.push(
		OmnichannelServiceLevelAgreements.col.count().then((count) => {
			statistics.slas = count;
			return true;
		}),
	);

	statsPms.push(
		LivechatRooms.col.countDocuments({ priorityId: { $exists: true } }).then((count) => {
			statistics.omnichannelRoomsWithPriorities = count;
			return true;
		}),
	);

	statsPms.push(
		LivechatRooms.col.countDocuments({ slaId: { $exists: true } }).then((count) => {
			statistics.omnichannelRoomsWithSlas = count;
			return true;
		}),
	);

	// Number of business units
	statsPms.push(
		LivechatUnit.countUnits().then((count) => {
			statistics.businessUnits = count;
			return true;
		}),
	);

	statsPms.push(
		// Total livechat monitors
		Users.col.countDocuments({ roles: 'livechat-monitor' }).then((count) => {
			statistics.livechatMonitors = count;
			return true;
		}),
	);

	// Number of PDF transcript requested
	statsPms.push(
		LivechatRooms.find({ pdfTranscriptRequested: { $exists: true } })
			.count()
			.then((count) => {
				statistics.omnichannelPdfTranscriptRequested = count;
			}),
	);

	// Number of PDF transcript that succeeded
	statsPms.push(
		LivechatRooms.find({ pdfTranscriptFileId: { $exists: true } })
			.count()
			.then((count) => {
				statistics.omnichannelPdfTranscriptSucceeded = count;
			}),
	);

	await Promise.all(statsPms).catch(log);

	return statistics as EEOnlyStats;
}
