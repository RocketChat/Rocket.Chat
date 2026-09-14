import type { ICallHistoryQuery, ICallHistoryPage, ICallHistoryRead } from '@rocket.chat/apps-engine/definition/accessors/ICallHistoryRead';
import type { ICallHistoryEntry } from '@rocket.chat/apps-engine/definition/callHistory';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

// A factory, not a shared constant: this value is handed straight to app code, and an app that
// mutated a shared object would corrupt every later denied call.
const emptyPage = (): ICallHistoryPage => ({ entries: [], total: 0, count: 0, offset: 0 });

export class CallHistoryRead implements ICallHistoryRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(historyId: string): Promise<ICallHistoryEntry | undefined> {
		if (!historyId) {
			return Promise.resolve(undefined);
		}

		// The host serializes a bridge's `undefined` as `null`, which is what a missing row and a
		// missing permission both come back as. Normalizing here is what makes the declared
		// `| undefined` true, rather than something the app has to second-guess.
		return bridgeCall<ICallHistoryEntry | null>(this.senderFn, 'getCallHistoryBridge', 'doGetById', historyId, 'APP_ID').then(
			(entry) => entry ?? undefined,
		);
	}

	public getByCallId(callId: string): Promise<ICallHistoryEntry[]> {
		if (!callId) {
			return Promise.resolve<ICallHistoryEntry[]>([]);
		}

		return bridgeCall<ICallHistoryEntry[]>(this.senderFn, 'getCallHistoryBridge', 'doGetByCallId', callId, 'APP_ID');
	}

	public find(query: ICallHistoryQuery = {}): Promise<ICallHistoryPage> {
		// Same normalization as `getById`: a denied call arrives as `null`, and an empty page lets
		// callers read `.entries` without a guard.
		return bridgeCall<ICallHistoryPage | null>(this.senderFn, 'getCallHistoryBridge', 'doFind', query, 'APP_ID').then(
			(page) => page ?? emptyPage(),
		);
	}
}
