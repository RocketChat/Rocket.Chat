import type { IRoom, IMessage, IThreadMainMessage, IThreadMessage, Serialized } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { getNumericConfig } from '../../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';
import { modifyMessageOnFilesDelete } from '../../../../../lib/utils/modifyMessageOnFilesDelete';
import {
	createDeleteCriteria,
	markThreadMessagesAsRead,
	mergeThreadMessages,
	mutateThreadMessagesInfiniteData,
	type ThreadMessagesInfiniteData,
	upsertThreadMessageInCache,
} from '../../../../../lib/utils/threadMessageUtils';
import { useRoom } from '../../../contexts/RoomContext';

const processMessages = async (messages: IMessage[]): Promise<IMessage[]> => {
	return Promise.all(messages.map((msg) => onClientMessageReceived(msg)));
};

const filterThreadMessages = (messages: Serialized<IMessage>[], tmid: IThreadMainMessage['_id']): IThreadMessage[] => {
	return messages
		.map((m) => mapMessageFromApi(m))
		.filter((msg): msg is IThreadMessage => isThreadMessage(msg) && msg.tmid === tmid && msg._id !== tmid && msg._hidden !== true);
};

export const useThreadMessagesQuery = (tmid: IThreadMainMessage['_id'], rid?: IRoom['_id']) => {
	const room = useRoom();
	const roomId = rid ?? room._id;

	const queryClient = useQueryClient();
	const queryKey = roomsQueryKeys.threadMessages(roomId, tmid);
	const getThreadMessages = useEndpoint('GET', '/v1/chat.getThreadMessages');
	// `chat.getThreadMessages` is a plain read, so marking the thread as read is an
	// explicit call — the DDP method it replaced did both server-side.
	const readThread = useEndpoint('POST', '/v1/chat.readThread');

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const unprocessedReadMessagesEvent = useRef<{ tmid: string; until: Date } | null>(null);

	const count = getNumericConfig('threadMessagesSize', 50);

	useEffect(() => {
		const currentQueryKey = roomsQueryKeys.threadMessages(roomId, tmid);

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(roomId, async (event) => {
			if (event.tmid !== tmid || event._hidden === true) {
				return;
			}

			const processed = await onClientMessageReceived(event);
			upsertThreadMessageInCache(processed, roomId, tmid, queryClient);
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${roomId}/deleteMessage`, (event) => {
			mutateThreadMessagesInfiniteData(queryClient, currentQueryKey, (messages) => {
				const index = messages.findIndex((m) => m._id === event._id);
				if (index !== -1) {
					messages.splice(index, 1);
				}
			});
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${roomId}/deleteMessageBulk`, (bulkParams) => {
			const matchDeleteCriteria = createDeleteCriteria(bulkParams);

			mutateThreadMessagesInfiniteData(queryClient, currentQueryKey, (messages) => {
				if (bulkParams.filesOnly) {
					for (let index = 0; index < messages.length; index++) {
						const msg = messages[index];
						if (matchDeleteCriteria(msg)) {
							messages[index] = modifyMessageOnFilesDelete(msg, bulkParams.replaceFileAttachmentsWith);
						}
					}
					return;
				}

				const filtered = messages.filter((msg) => !matchDeleteCriteria(msg));
				messages.splice(0, messages.length, ...filtered);
			});
		});

		const unsubscribeFromMessagesRead = subscribeToNotifyRoom(`${roomId}/messagesRead`, ({ tmid: eventTmid, until }) => {
			if (eventTmid && eventTmid !== tmid) {
				return;
			}

			const isPending = queryClient.getQueryState(currentQueryKey)?.fetchStatus === 'fetching';
			if (isPending) {
				unprocessedReadMessagesEvent.current = { tmid, until };
				return;
			}

			mutateThreadMessagesInfiniteData(queryClient, currentQueryKey, (messages) => {
				const updated = markThreadMessagesAsRead(messages, until);
				messages.splice(0, messages.length, ...updated);
			});
		});

		return () => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
			unsubscribeFromMessagesRead();
		};
	}, [tmid, roomId, queryClient, subscribeToRoomMessages, subscribeToNotifyRoom]);

	const loadMessageAround = useCallback(
		async (messageId: string) => {
			const currentQueryKey = roomsQueryKeys.threadMessages(roomId, tmid);

			await queryClient.cancelQueries({ queryKey: currentQueryKey });

			const { messages, total, offset } = await getThreadMessages({
				tmid,
				aroundId: messageId,
				count,
				sort: JSON.stringify({ ts: 1 }),
			});

			const filtered = filterThreadMessages(messages, tmid);
			const processed = (await processMessages(filtered)) as IThreadMessage[];

			const pageSize = Math.min(processed.length, count);
			const pageParam = Math.max(0, total - offset - pageSize);

			queryClient.setQueryData<ThreadMessagesInfiniteData>(currentQueryKey, {
				pages: [{ items: processed, itemCount: total }],
				pageParams: [pageParam],
			});
		},
		[queryClient, getThreadMessages, roomId, tmid, count],
	);

	const jumpToRecent = useCallback(async () => {
		await queryClient.resetQueries({ queryKey: roomsQueryKeys.threadMessages(roomId, tmid) });
	}, [queryClient, roomId, tmid]);

	const query = useInfiniteQuery({
		queryKey,
		queryFn: async ({ pageParam: offset }) => {
			if (offset === 0) {
				void Promise.resolve(readThread({ tmid })).catch(() => undefined);
			}

			const cachedData = offset === 0 ? queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey) : undefined;
			const cachedMessages = cachedData?.pages.at(-1)?.items ?? [];

			const { messages, total } = await getThreadMessages({
				tmid,
				offset,
				count,
				sort: JSON.stringify({ ts: -1 }),
			});

			let filtered = filterThreadMessages(messages, tmid);
			if (offset === 0) {
				filtered = mergeThreadMessages(cachedMessages, filtered);
			}

			if (offset === 0 && unprocessedReadMessagesEvent.current?.tmid === tmid) {
				const { until } = unprocessedReadMessagesEvent.current;
				unprocessedReadMessagesEvent.current = null;
				filtered = markThreadMessagesAsRead(filtered, until);
			}

			const processed = (await processMessages(filtered)) as IThreadMessage[];

			return {
				items: processed,
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (lastPageParam <= 0) {
				return undefined;
			}
			const pageSize = Math.min(lastPage.items.length, count);
			if (pageSize <= 0) {
				return undefined;
			}
			return Math.max(0, lastPageParam - pageSize);
		},
		getPreviousPageParam: (firstPage, _allPages, firstPageParam) => {
			const pageSize = Math.min(firstPage.items.length, count);
			if (pageSize <= 0) {
				return undefined;
			}
			const next = firstPageParam + pageSize;
			return next < firstPage.itemCount ? next : undefined;
		},
		select: ({ pages }) => {
			const byId = new Map<string, IThreadMessage>();
			for (const page of pages) {
				for (const item of page.items) {
					byId.set(item._id, item);
				}
			}
			const messages = Array.from(byId.values()).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
			return {
				messages,
				itemCount: pages.at(-1)?.itemCount ?? 0,
			};
		},
		refetchOnWindowFocus: false,
	});

	return { ...query, loadMessageAround, jumpToRecent };
};
