import type { ICallHistoryItem as IAppsCallHistoryItem } from '@rocket.chat/apps-engine/definition/mediaCalls';
import type { CallHistoryItem } from '@rocket.chat/core-typings';

export function toAppCallHistoryItem(item: CallHistoryItem): IAppsCallHistoryItem {
	const base = {
		id: item._id,
		uid: item.uid,
		ts: item.ts,
		callId: item.callId,
		direction: item.direction,
		state: item.state,
		type: item.type,
		duration: item.duration,
		endedAt: item.endedAt,
	};

	if (item.external) {
		return {
			...base,
			external: true,
			contactExtension: item.contactExtension,
		};
	}

	return {
		...base,
		external: false,
		contactId: item.contactId,
		...(item.contactName && { contactName: item.contactName }),
		...(item.contactUsername && { contactUsername: item.contactUsername }),
		...(item.rid && { rid: item.rid }),
		...(item.messageId && { messageId: item.messageId }),
	};
}
