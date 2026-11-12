import type { ICallHistorySearchResult } from '@rocket.chat/apps-engine/definition/accessors/index.js';
import type { ICallHistoryItem } from '@rocket.chat/apps-engine/definition/mediaCalls/index.js';

import { CallHistoryBridge } from '../../../src/server/bridges/index.js';

export class TestsCallHistoryBridge extends CallHistoryBridge {
	public getById(id: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined> {
		throw new Error('Method not implemented.');
	}

	public getByCallId(callId: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined> {
		throw new Error('Method not implemented.');
	}

	public search(uid: string): Promise<ICallHistorySearchResult> {
		throw new Error('Method not implemented.');
	}
}
