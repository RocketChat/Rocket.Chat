import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { CallHistoryBridge } from '@rocket.chat/apps/dist/server/bridges/CallHistoryBridge';
import type {
	ICallHistorySearchFilters,
	ICallHistorySearchPagination,
	ICallHistorySearchResult,
} from '@rocket.chat/apps-engine/definition/accessors';
import type { ICallHistoryItem as IAppsCallHistoryItem } from '@rocket.chat/apps-engine/definition/mediaCalls';
import { CallHistory as CallHistoryService } from '@rocket.chat/core-services';
import { CallHistory } from '@rocket.chat/models';

import { toAppCallHistoryItem } from '../converters/callHistory';

const DEFAULT_COUNT = 50;
const MAX_COUNT = 100;

// Mongo reads a limit of 0 as "no limit", so the floor is 1 rather than 0
const clampCount = (count: number): number => Math.min(Math.max(Math.trunc(count) || DEFAULT_COUNT, 1), MAX_COUNT);

export class AppCallHistoryBridge extends CallHistoryBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(id: string, uid: string, appId: string): Promise<IAppsCallHistoryItem | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the call history item byId: "${id}"`);

		const item = await CallHistory.findOneByIdAndUid(id, uid);
		if (!item) {
			return undefined;
		}

		return toAppCallHistoryItem(item);
	}

	protected async getByCallId(callId: string, uid: string, appId: string): Promise<IAppsCallHistoryItem | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the call history item byCallId: "${callId}"`);

		const item = await CallHistory.findOneByCallIdAndUid(callId, uid);
		if (!item) {
			return undefined;
		}

		return toAppCallHistoryItem(item);
	}

	protected async search(
		uid: string,
		filters: ICallHistorySearchFilters | undefined,
		pagination: ICallHistorySearchPagination | undefined,
		appId: string,
	): Promise<ICallHistorySearchResult> {
		this.orch.debugLog(`The App ${appId} is searching the call history of the user: "${uid}"`);

		const { count = DEFAULT_COUNT, offset = 0, sort } = pagination || {};

		const { items, total } = await CallHistoryService.search(
			uid,
			{
				...(filters?.searchTerm && { searchTerm: filters.searchTerm }),
				...(filters?.direction && { direction: filters.direction }),
				...(filters?.inStates?.length && { inStates: filters.inStates }),
			},
			{
				count: clampCount(count),
				offset: Math.max(Math.trunc(offset) || 0, 0),
				...(sort && { sort }),
			},
		);

		return {
			items: items.map(toAppCallHistoryItem),
			total,
		};
	}
}
