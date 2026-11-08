import type {
	ICallHistoryRead,
	ICallHistorySearchFilters,
	ICallHistorySearchPagination,
	ICallHistorySearchResult,
} from '@rocket.chat/apps-engine/definition/accessors';
import type { ICallHistoryItem } from '@rocket.chat/apps-engine/definition/mediaCalls';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class CallHistoryRead implements ICallHistoryRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string, uid: string): Promise<ICallHistoryItem | undefined> {
		return bridgeCall<ICallHistoryItem | undefined>(this.senderFn, 'getCallHistoryBridge', 'doGetById', id, uid, 'APP_ID');
	}

	public getByCallId(callId: string, uid: string): Promise<ICallHistoryItem | undefined> {
		return bridgeCall<ICallHistoryItem | undefined>(this.senderFn, 'getCallHistoryBridge', 'doGetByCallId', callId, uid, 'APP_ID');
	}

	public search(
		uid: string,
		filters?: ICallHistorySearchFilters,
		pagination?: ICallHistorySearchPagination,
	): Promise<ICallHistorySearchResult | undefined> {
		return bridgeCall<ICallHistorySearchResult | undefined>(
			this.senderFn,
			'getCallHistoryBridge',
			'doSearch',
			uid,
			filters,
			pagination,
			'APP_ID',
		);
	}
}
