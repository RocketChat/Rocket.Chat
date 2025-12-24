import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { InfiniteData } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useInfiniteMessageQueryUpdates = <T extends IMessage, TQueryKey extends readonly unknown[]>({
	queryKey,
	roomId,
	filter,
	compare,
}: {
	queryKey: TQueryKey;
	roomId: IRoom['_id'];
	filter: (message: IMessage) => message is T;
	compare: (a: T, b: T) => number;
}) => {
	const queryClient = useQueryClient();

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const getQueryKey = useEffectEvent(() => queryKey);
	const getFilter = useEffectEvent(() => filter);
	const getCompare = useEffectEvent(() => compare);

	const mutateQueryData = useEffectEvent((mutation: (items: T[]) => void) => {
		const queryData = queryClient.getQueryData<
			InfiniteData<
				{
					items: T[];
					itemCount: number;
				},
				number
			>
		>(queryKey);

		const items = queryData?.pages.flatMap((page) => page.items) ?? [];

		mutation(items);

		const lastPage = queryData?.pages.at(-1) ?? { items: [], itemCount: 0 };

		const itemCount = lastPage.itemCount || items.length;
		const pageSize = lastPage.items.length || items.length;
		const newPageCount = pageSize > 0 ? Math.ceil(items.length / pageSize) : 0;

		const newQueryData: typeof queryData = {
			pages: Array.from({ length: newPageCount }, (_, pageIndex) => ({
				items: items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
				itemCount,
			})),
			pageParams: Array.from({ length: newPageCount }, (_, pageIndex) => pageIndex * pageSize),
		};

		queryClient.setQueryData<
			InfiniteData<
				{
					items: T[];
					itemCount: number;
				},
				number
			>
		>(queryKey, newQueryData);
	});

	const userId = useUserId();

	useEffect(() => {
		if (!userId || !roomId) {
			return;
		}

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(roomId, (message) => {
			if (!getFilter()(message as T)) return;

			mutateQueryData((items) => {
				const index = items.findIndex((i) => i._id === message._id);
				if (index !== -1) {
					items[index] = message as T;
				} else {
					items.push(message as T);
					items.sort(getCompare());
				}
			});
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${roomId}/deleteMessage`, ({ _id }) => {
			mutateQueryData((items) => {
				const index = items.findIndex((i) => i._id === _id);
				if (index !== -1) {
					items.splice(index, 1);
				}
			});
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${roomId}/deleteMessageBulk`, () => {
			queryClient.invalidateQueries({ queryKey: getQueryKey() });
		});

		return () => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [subscribeToRoomMessages, subscribeToNotifyRoom, userId, roomId, queryClient, getQueryKey, getFilter, getCompare, mutateQueryData]);
};
