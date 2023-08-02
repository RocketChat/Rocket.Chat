import { isThreadMainMessage } from '@rocket.chat/core-typings';
import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import type { FieldExpression, Query } from '../../../../../lib/minimongo';
import { createFilterFromQuery } from '../../../../../lib/minimongo';
import { onClientMessageReceived } from '../../../../../lib/onClientMessageReceived';
import { useRoom } from '../../../contexts/RoomContext';
import { useGetMessageByID } from './useGetMessageByID';

type RoomMessagesRidEvent = IMessage;

type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const createDeleteCriteria = (params: NotifyRoomRidDeleteMessageBulkEvent): ((message: IMessage) => boolean) => {
	const query: Query<IMessage> = { ts: params.ts };

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users?.length) {
		query['u.username'] = { $in: params.users };
	}

	return createFilterFromQuery<IMessage>(query);
};

const useSubscribeToMessage = () => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	return useCallback(
		(message: IMessage, { onMutate, onDelete }: { onMutate?: (message: IMessage) => void; onDelete?: () => void }) => {
			const unsubscribeFromRoomMessages = subscribeToRoomMessages(message.rid, (event: RoomMessagesRidEvent) => {
				if (message._id === event._id) onMutate?.(event);
			});

			const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${message.rid}/deleteMessage`, (event) => {
				if (message._id === event._id) onDelete?.();
			});

			const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${message.rid}/deleteMessageBulk`, (params) => {
				const matchDeleteCriteria = createDeleteCriteria(params);
				if (matchDeleteCriteria(message)) onDelete?.();
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

	return useQuery(['rooms', room._id, 'threads', tmid, 'main-message'] as const, async ({ queryKey }) => {
		const message = await getMessage(tmid);

		const mainMessage = (await onClientMessageReceived(message)) || message;

		if (!mainMessage && !isThreadMainMessage(mainMessage)) {
			throw new Error('Invalid main message');
		}

		unsubscribeRef.current =
			unsubscribeRef.current ||
			subscribeToMessage(mainMessage, {
				onMutate: () => {
					queryClient.invalidateQueries(queryKey, { exact: true });
				},
				onDelete: () => {
					onDelete?.();
					queryClient.invalidateQueries(queryKey, { exact: true });
				},
			});

		return mainMessage;
	});
};
