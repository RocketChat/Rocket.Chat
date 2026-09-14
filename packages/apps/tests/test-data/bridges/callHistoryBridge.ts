import type { ICallHistoryPage, ICallHistoryQuery } from '@rocket.chat/apps-engine/definition/accessors/ICallHistoryRead';
import type { ICallHistoryEntry } from '@rocket.chat/apps-engine/definition/callHistory';

import { CallHistoryBridge } from '../../../src/server/bridges';

export class TestsCallHistoryBridge extends CallHistoryBridge {
	protected getById(_historyId: string, _appId: string): Promise<ICallHistoryEntry | undefined> {
		throw new Error('Method not implemented.');
	}

	protected getByCallId(_callId: string, _appId: string): Promise<ICallHistoryEntry[]> {
		throw new Error('Method not implemented.');
	}

	protected find(_query: ICallHistoryQuery, _appId: string): Promise<ICallHistoryPage> {
		throw new Error('Method not implemented.');
	}
}
