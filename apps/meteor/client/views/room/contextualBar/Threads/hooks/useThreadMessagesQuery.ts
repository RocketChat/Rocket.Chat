import { isThreadMessage, type IMessage, type IRoom, type IThreadMainMessage, type IThreadMessage } from '@rocket.chat/core-typings';
import { useMethod, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { modifyMessageOnFilesDelete } from '../../../../../lib/utils/modifyMessageOnFilesDelete';
import {
	createDeleteCriteria,
	markThreadMessagesAsRead,
	mergeThreadMessages,
	upsertThreadMessageInCache,
} from '../../../../../lib/utils/threadMessageUtils';
import { useRoom } from '../../../contexts/RoomContext';

const processMessages = async (messages: IMessage[]): Promise<IMessage[]> => {
	return Promise.all(messages.map((msg) => onClientMessageReceived(msg)));
};

export const useThreadMessagesQuery = (tmid: IThreadMainMessage['_id'], rid?: IRoom['_id']) => {
	const room = useRoom();
	const roomId = rid ?? room._id;

	const queryClient = useQueryClient();
	const queryKey = roomsQueryKeys.threadMessages(roomId, tmid);
	const getThreadMessages = useMethod('getThreadMessages');

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const unprocessedReadMessagesEvent = useRef<{ tmid: string; until: Date } | null>(null);

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
			queryClient.setQueryData<IThreadMessage[]>(currentQueryKey, (old) => {
				if (!old) {
					return old;
				}
				return old.filter((m) => m._id !== event._id);
			});
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${roomId}/deleteMessageBulk`, (bulkParams) => {
			const matchDeleteCriteria = createDeleteCriteria(bulkParams);

			queryClient.setQueryData<IThreadMessage[]>(currentQueryKey, (old) => {
				if (!old) {
					return old;
				}

				if (bulkParams.filesOnly) {
					return old.map((msg) => {
						if (matchDeleteCriteria(msg)) {
							return modifyMessageOnFilesDelete(msg, bulkParams.replaceFileAttachmentsWith);
						}
						return msg;
					});
				}

				return old.filter((msg) => !matchDeleteCriteria(msg));
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

			queryClient.setQueryData<IThreadMessage[]>(currentQueryKey, (old) => {
				if (!old) {
					return old;
				}
				return markThreadMessagesAsRead(old, until);
			});
		});

		return () => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
			unsubscribeFromMessagesRead();
		};
	}, [tmid, roomId, queryClient, subscribeToRoomMessages, subscribeToNotifyRoom]);

	return useQuery({
		queryKey,
		queryFn: async () => {
			const cachedMessages = queryClient.getQueryData<IThreadMessage[]>(queryKey) || [];

			const messages = await getThreadMessages({ tmid });
			const filtered = messages.filter(
				(msg): msg is IThreadMessage => isThreadMessage(msg) && msg.tmid === tmid && msg._id !== tmid && msg._hidden !== true,
			);

			const sorted = mergeThreadMessages(cachedMessages, filtered);
			if (unprocessedReadMessagesEvent.current) {
				const { until } = unprocessedReadMessagesEvent.current;
				unprocessedReadMessagesEvent.current = null;
				return processMessages(markThreadMessagesAsRead(sorted, until)) as Promise<Array<IThreadMessage>>;
			}
			return processMessages(sorted) as Promise<Array<IThreadMessage>>;
		},
	});
};
