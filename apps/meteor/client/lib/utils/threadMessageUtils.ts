import type { IMessage, IThreadMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { QueryClient } from '@tanstack/react-query';
import type { Condition, Filter } from 'mongodb';

import { queryClient as defaultQueryClient } from '../queryClient';
import { roomsQueryKeys } from '../queryKeys';

export type NotifyRoomRidDeleteBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: Condition<Date>;
	users: string[];
	ids?: string[];
	showDeletedStatus?: boolean;
} & (
	| {
			filesOnly: true;
			replaceFileAttachmentsWith?: MessageAttachment;
	  }
	| {
			filesOnly?: false;
	  }
);

export const createDeleteCriteria = (params: NotifyRoomRidDeleteBulkEvent): ((message: IMessage) => boolean) => {
	const query: Filter<IMessage> = {};

	if (params.ids) {
		query._id = { $in: params.ids };
	} else {
		query.ts = params.ts;
	}

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users?.length) {
		query['u.username'] = { $in: params.users };
	}

	return createPredicateFromFilter(query);
};

export const upsertThreadMessageInCache = (
	message: IMessage,
	rid: IMessage['rid'],
	tmid: IMessage['_id'],
	client: QueryClient = defaultQueryClient,
): void => {
	const queryKey = roomsQueryKeys.threadMessages(rid, tmid);
	client.setQueryData<IMessage[]>(queryKey, (old) => {
		if (!old) {
			return [message];
		}
		const idx = old.findIndex((m) => m._id === message._id);
		if (idx >= 0) {
			const updated = [...old];
			updated[idx] = message;
			return updated;
		}
		return [...old, message].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
	});
};

export const markThreadMessagesAsRead = (messages: IThreadMessage[], until?: Date): IThreadMessage[] => {
	return messages.map((msg) => {
		if (!msg.unread) {
			return msg;
		}
		if (until && new Date(msg.ts) > until) {
			return msg;
		}
		const { unread: _, ...rest } = msg;
		return rest as IThreadMessage;
	});
};

export const mergeThreadMessages = (cachedMessages: IThreadMessage[], fetchedMessages: IThreadMessage[]): IThreadMessage[] => {
	const messageMap = new Map<string, IThreadMessage>();

	for (const msg of cachedMessages) {
		messageMap.set(msg._id, msg);
	}

	for (const msg of fetchedMessages) {
		const existing = messageMap.get(msg._id);
		if (!existing) {
			messageMap.set(msg._id, msg);
		} else {
			const msgTime = new Date(msg._updatedAt ?? msg.ts).getTime();
			const existingTime = new Date(existing._updatedAt ?? existing.ts).getTime();
			if (msgTime > existingTime) {
				messageMap.set(msg._id, msg);
			}
		}
	}

	return Array.from(messageMap.values()).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
};
