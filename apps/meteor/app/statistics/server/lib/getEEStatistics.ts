import { log } from 'console';

import { Analytics } from '@rocket.chat/core-services';
import type { IStats } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { CannedResponse, OmnichannelServiceLevelAgreements, LivechatRooms, LivechatTag, LivechatUnit, Users } from '@rocket.chat/models';

import { getVoIPStatistics } from './getVoIPStatistics';

type ENTERPRISE_STATISTICS = IStats['enterprise'];

type GenericStats = Pick<ENTERPRISE_STATISTICS, 'modules' | 'tags' | 'seatRequests'>;

type EEOnlyStats = Omit<ENTERPRISE_STATISTICS, keyof GenericStats>;

export async function getStatistics(): Promise<ENTERPRISE_STATISTICS> {
	const genericStats: GenericStats = {
		modules: License.getModules(),
		tags: License.getTags().map(({ name }) => name),
		seatRequests: await Analytics.getSeatRequestCount(),
	};

	const eeModelsStats = await getEEStatistics();

	const statistics = {
		...genericStats,
		...eeModelsStats,
	};

	return statistics;
}

async function getEEStatistics(): Promise<EEOnlyStats | undefined> {
	if (!License.hasModule('livechat-enterprise')) {
		return;
	}

	const statsPms: Array<Promise<any>> = [];

	const statistics: Partial<EEOnlyStats> = {};

	// Number of livechat tags
	statsPms.push(
		LivechatTag.estimatedDocumentCount().then((count) => {
			statistics.livechatTags = count;
			return true;
		}),
	);

	// Number of canned responses
	statsPms.push(
		CannedResponse.estimatedDocumentCount().then((count) => {
			statistics.cannedResponses = count;
			return true;
		}),
	);

	// Number of Service Level Agreements
	statsPms.push(
		OmnichannelServiceLevelAgreements.estimatedDocumentCount().then((count) => {
			statistics.slas = count;
			return true;
		}),
	);

	statsPms.push(
		LivechatRooms.countPrioritizedRooms().then((count) => {
			statistics.omnichannelRoomsWithPriorities = count;
			return true;
		}),
	);

	statsPms.push(
		LivechatRooms.countRoomsWithSla().then((count) => {
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
		Users.countByRole('livechat-monitor').then((count) => {
			statistics.livechatMonitors = count;
			return true;
		}),
	);

	// Number of PDF transcript requested
	statsPms.push(
		LivechatRooms.countRoomsWithPdfTranscriptRequested().then((count) => {
			statistics.omnichannelPdfTranscriptRequested = count;
		}),
	);

	// Number of PDF transcript that succeeded
	statsPms.push(
		LivechatRooms.countRoomsWithTranscriptSent().then((count) => {
			statistics.omnichannelPdfTranscriptSucceeded = count;
		}),
	);

	// TeamCollab VoIP data
	statsPms.push(
		getVoIPStatistics().then((voip) => {
			statistics.voip = voip;
		}),
	);

	await Promise.all(statsPms).catch(log);

	return statistics as EEOnlyStats;
}
