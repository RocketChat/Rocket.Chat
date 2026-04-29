import { isThreadMessage, type IMessage, type IRoom, type IThreadMainMessage, type IThreadMessage } from '@rocket.chat/core-typings';
import { useMethod, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { modifyMessageOnFilesDelete } from '../../../../../lib/utils/modifyMessageOnFilesDelete';
import { createDeleteCriteria, upsertThreadMessageInCache } from '../../../../../lib/utils/threadMessageUtils';
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

	useEffect(() => {
		const currentQueryKey = roomsQueryKeys.threadMessages(roomId, tmid);

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(roomId, async (event) => {
			if (event.tmid !== tmid) {
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

		const unsubscribeFromMessagesRead = subscribeToNotifyRoom(`${roomId}/messagesRead`, ({ tmid: eventTmid }) => {
			if (eventTmid && eventTmid !== tmid) {
				return;
			}

			queryClient.setQueryData<IThreadMessage[]>(currentQueryKey, (old) => {
				if (!old) {
					return old;
				}

				return old.map((msg) => {
					if (msg.unread) {
						const { unread: _, ...rest } = msg;
						return rest as IThreadMessage;
					}
					return msg;
				});
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
			const messages = await getThreadMessages({ tmid });
			const filtered = messages.filter(
				(msg): msg is IThreadMessage => isThreadMessage(msg) && msg.tmid === tmid && msg._id !== tmid && msg._hidden !== true,
			);
			const sorted = filtered.sort((a, b) => a.ts.getTime() - b.ts.getTime());
			return processMessages(sorted) as Promise<Array<IThreadMessage>>;
		},
	});
};
