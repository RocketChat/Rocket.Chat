import type { IMessage, IThreadMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
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

export type ThreadMessagesPage = {
	items: IThreadMessage[];
	itemCount: number;
};

export type ThreadMessagesInfiniteData = InfiniteData<ThreadMessagesPage, number>;

export const mutateThreadMessagesInfiniteData = (
	client: QueryClient,
	queryKey: readonly unknown[],
	mutation: (messages: IThreadMessage[]) => void,
): void => {
	client.setQueryData<ThreadMessagesInfiniteData>(queryKey, (old) => {
		if (!old?.pages.length) {
			return old;
		}

		const items = old.pages.flatMap((page) => page.items);
		const lastPage = old.pages.at(-1) ?? { items: [], itemCount: 0 };

		const beforeMutationItemsLength = items.length;
		mutation(items);
		const afterMutationItemsLength = items.length;

		const pageSize = lastPage.items.length || items.length;
		if (pageSize === 0) {
			return old;
		}

		const newPageCount = Math.ceil(items.length / pageSize);
		const itemCountDelta = beforeMutationItemsLength - afterMutationItemsLength;

		return {
			pages: Array.from({ length: newPageCount }, (_, pageIndex) => ({
				items: items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
				itemCount: lastPage.itemCount - itemCountDelta,
			})),
			pageParams: Array.from({ length: newPageCount }, (_, pageIndex) => pageIndex * pageSize),
		};
	});
};

export const upsertThreadMessageInCache = (
	message: IMessage,
	rid: IMessage['rid'],
	tmid: IMessage['_id'],
	client: QueryClient = defaultQueryClient,
): void => {
	const queryKey = roomsQueryKeys.threadMessages(rid, tmid);

	if (!client.getQueryData<ThreadMessagesInfiniteData>(queryKey)) {
		client.setQueryData<ThreadMessagesInfiniteData>(queryKey, {
			pages: [{ items: [message as IThreadMessage], itemCount: 1 }],
			pageParams: [0],
		});
		return;
	}

	mutateThreadMessagesInfiniteData(client, queryKey, (messages) => {
		const idx = messages.findIndex((m) => m._id === message._id);
		if (idx >= 0) {
			messages[idx] = message as IThreadMessage;
			return;
		}

		messages.push(message as IThreadMessage);
		messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
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
