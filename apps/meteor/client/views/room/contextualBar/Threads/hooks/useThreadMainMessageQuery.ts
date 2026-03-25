import type { IMessage, IThreadMainMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { useGetMessageByID } from './useGetMessageByID';
import { withDebouncing } from '../../../../../../lib/utils/highOrderFunctions';
import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { modifyMessageOnFilesDelete } from '../../../../../lib/utils/modifyMessageOnFilesDelete';
import { createDeleteCriteria } from '../../../../../lib/utils/threadMessageUtils';
import { useRoom } from '../../../contexts/RoomContext';

type RoomMessagesRidEvent = IMessage;

const useSubscribeToMessage = () => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	return useCallback(
		(
			message: IMessage,
			{
				onMutate,
				onDelete,
				onFilesDelete,
			}: {
				onMutate?: (message: IMessage) => void | Promise<void>;
				onDelete?: () => void | Promise<void>;
				onFilesDelete?: (replaceFileAttachmentsWith?: MessageAttachment) => void | Promise<void>;
			},
		) => {
			const unsubscribeFromRoomMessages = subscribeToRoomMessages(message.rid, (event: RoomMessagesRidEvent) => {
				if (message._id === event._id) onMutate?.(event);
			});

			const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${message.rid}/deleteMessage`, (event) => {
				if (message._id === event._id) onDelete?.();
			});

			const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${message.rid}/deleteMessageBulk`, (params) => {
				const matchDeleteCriteria = createDeleteCriteria(params);
				if (matchDeleteCriteria(message)) {
					if (params.filesOnly) {
						return onFilesDelete?.(params.replaceFileAttachmentsWith);
					}
					return onDelete?.();
				}
			});

			return () => {
				unsubscribeFromRoomMessages();
				unsubscribeFromDeleteMessage();
				unsubscribeFromDeleteMessageBulk();
			};
		},
		[subscribeToNotifyRoom, subscribeToRoomMessages],
	);
};

export const useThreadMainMessageQuery = (
	tmid: IMessage['_id'],
	{ onDelete }: { onDelete?: () => void } = {},
): UseQueryResult<IThreadMainMessage, Error> => {
	const room = useRoom();

	const getMessage = useGetMessageByID();
	const subscribeToMessage = useSubscribeToMessage();

	const queryClient = useQueryClient();
	const unsubscribeRef = useRef<(() => void) | undefined>();

	useEffect(() => {
		return () => {
			unsubscribeRef.current?.();
			unsubscribeRef.current = undefined;
		};
	}, [tmid]);

	return useQuery({
		queryKey: roomsQueryKeys.threadMainMessage(room._id, tmid),

		queryFn: async ({ queryKey }) => {
			const mainMessage = await getMessage(tmid);

			if (!mainMessage) {
				throw new Error('Invalid main message');
			}

			const debouncedInvalidate = withDebouncing({ wait: 10000 })(() => {
				queryClient.invalidateQueries({ queryKey, exact: true });
			});

			unsubscribeRef.current =
				unsubscribeRef.current ||
				subscribeToMessage(mainMessage, {
					onMutate: async (message) => {
						const msg = await onClientMessageReceived(message);
						queryClient.setQueryData(queryKey, () => msg);
						debouncedInvalidate();
					},
					onDelete: () => {
						onDelete?.();
						queryClient.invalidateQueries({ queryKey, exact: true });
					},
					onFilesDelete: async (replaceFileAttachmentsWith?: MessageAttachment) => {
						const current = queryClient.getQueryData<IThreadMainMessage>(queryKey);
						if (!current) {
							return;
						}
						const updated = modifyMessageOnFilesDelete(current, replaceFileAttachmentsWith);

						const msg = await onClientMessageReceived(updated);
						queryClient.setQueryData(queryKey, () => msg);
						debouncedInvalidate();
					},
				});

			return mainMessage;
		},
	});
};
