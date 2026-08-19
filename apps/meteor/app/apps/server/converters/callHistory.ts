import type { IAppCallHistoryConverter, IAppsCallHistoryCallDetails, IAppsCallHistoryEntry, IAppsCallHistoryItem } from '@rocket.chat/apps';
import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { CallHistoryCallDetailsCodec, CallHistoryItemCodec } from './codecs';

export class AppCallHistoryConverter implements IAppCallHistoryConverter {
	convertItem(item: undefined | null): undefined;

	convertItem(item: CallHistoryItem): IAppsCallHistoryItem;

	convertItem(item: CallHistoryItem | undefined | null): IAppsCallHistoryItem | undefined;

	convertItem(item: CallHistoryItem | undefined | null): IAppsCallHistoryItem | undefined {
		if (!item) {
			return;
		}

		return z.decode(CallHistoryItemCodec, item);
	}

	convertCallDetails(call: undefined | null): undefined;

	convertCallDetails(call: IMediaCall): IAppsCallHistoryCallDetails;

	convertCallDetails(call: IMediaCall | undefined | null): IAppsCallHistoryCallDetails | undefined;

	convertCallDetails(call: IMediaCall | undefined | null): IAppsCallHistoryCallDetails | undefined {
		if (!call) {
			return;
		}

		return z.decode(CallHistoryCallDetailsCodec, call);
	}

	convertEntry(item: CallHistoryItem, call?: IMediaCall | null): IAppsCallHistoryEntry {
		const details = this.convertCallDetails(call);

		return {
			item: this.convertItem(item),
			// Omit the key entirely rather than setting it to `undefined`: the value crosses a
			// msgpack boundary, and an absent optional reads more cleanly on the app side.
			...(details && { call: details }),
		};
	}
}
