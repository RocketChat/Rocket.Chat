import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';

import type { IAppsCallHistoryCallDetails, IAppsCallHistoryEntry, IAppsCallHistoryItem } from '../AppsEngine';

export interface IAppCallHistoryConverter {
	convertItem(item: undefined | null): undefined;
	convertItem(item: CallHistoryItem): IAppsCallHistoryItem;
	convertItem(item: CallHistoryItem | undefined | null): IAppsCallHistoryItem | undefined;

	convertCallDetails(call: undefined | null): undefined;
	convertCallDetails(call: IMediaCall): IAppsCallHistoryCallDetails;
	convertCallDetails(call: IMediaCall | undefined | null): IAppsCallHistoryCallDetails | undefined;

	/** Pairs a history row with the call it came from. The call may be gone. */
	convertEntry(item: CallHistoryItem, call?: IMediaCall | null): IAppsCallHistoryEntry;
}
