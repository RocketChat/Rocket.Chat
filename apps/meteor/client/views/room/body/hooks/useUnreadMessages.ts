import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useRoomHistoryState } from '../../../../../app/ui-utils/client/lib/RoomHistoryManager';
import { withDebouncing } from '../../../../../lib/utils/highOrderFunctions';
import { useOpenedRoomUnreadSince } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../../stores';
import { useChat } from '../../contexts/ChatContext';

interface IUnreadMessages {
	count: number;
	since: Date;
}

const useUnreadMessages = (room: IRoom): readonly [data: IUnreadMessages | undefined, setUnreadCount: Dispatch<SetStateAction<number>>] => {
	const notLoadedCount = useRoomHistoryState(room._id, (state) => state.unreadNotLoaded);
	const [loadedCount, setLoadedCount] = useState(0);

	const count = useMemo(() => notLoadedCount + loadedCount, [notLoadedCount, loadedCount]);

	const since = useOpenedRoomUnreadSince();

	return useMemo(() => {
		if (count && since) {
			return [{ count, since }, setLoadedCount];
		}

		return [undefined, setLoadedCount];
	}, [count, since]);
};

export const useHandleUnread = (
	room: IRoom,
	subscription?: ISubscription,
): {
	handleUnreadBarJumpToButtonClick: () => void;
	handleMarkAsReadButtonClick: () => void;
	counter: readonly [number, Date | undefined];
	setUnreadCount: Dispatch<SetStateAction<number>>;
	setLastMessageDate: Dispatch<SetStateAction<Date | undefined>>;
	debouncedMessageRead: () => void;
} => {
	const subscribed = Boolean(subscription);
	const [unread, setUnreadCount] = useUnreadMessages(room);

	const [lastMessageDate, setLastMessageDate] = useState<Date | undefined>();

	const chat = useChat();

	const findFirstMessage = Messages.use((state) => state.findFirst);
	const filterMessages = Messages.use((state) => state.filter);

	if (!chat) {
		throw new Error('No ChatContext provided');
	}
	const handleUnreadBarJumpToButtonClick = useCallback(() => {
		const rid = room._id;
		const { firstUnread } = RoomHistoryManager.getRoom(rid);
		let message = firstUnread;
		if (!message) {
			message = findFirstMessage(
				(record) => record.rid === rid && record.ts.getTime() > (unread?.since.getTime() ?? -Infinity),
				(a, b) => a.ts.getTime() - b.ts.getTime(),
			);
		}
		if (!message) {
			return;
		}
		setMessageJumpQueryStringParameter(message?._id);
		chat.readStateManager.markAsRead();
		setUnreadCount(0);
	}, [room._id, setUnreadCount, findFirstMessage, unread?.since, chat.readStateManager]);

	const handleMarkAsReadButtonClick = useCallback(() => {
		chat.readStateManager.markAsRead();
		setUnreadCount(0);
	}, [chat.readStateManager, setUnreadCount]);

	useEffect(() => {
		if (!subscribed) {
			setUnreadCount(0);
			return;
		}

		const count = filterMessages(
			(record) =>
				record.rid === room._id &&
				!!lastMessageDate &&
				record.ts.getTime() <= lastMessageDate?.getTime() &&
				record.ts.getTime() > (subscription?.ls?.getTime() ?? -Infinity),
		).length;

		setUnreadCount(count);
	}, [filterMessages, lastMessageDate, room._id, setUnreadCount, subscribed, subscription?.ls]);

	const router = useRouter();

	const debouncedMessageRead = useMemo(
		() =>
			withDebouncing({ wait: 500 })(() => {
				if (subscribed) {
					chat.readStateManager.attemptMarkAsRead();
				}
			}),
		[chat.readStateManager, subscribed],
	);

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				const routeName = router.getRouteName();
				if (!routeName || !roomCoordinator.isRouteNameKnown(routeName)) {
					return;
				}

				debouncedMessageRead();
			}),
		[debouncedMessageRead, router],
	);

	useEffect(() => {
		if (subscription?.alert || subscription?.unread || subscribed) {
			debouncedMessageRead();
		}
	}, [debouncedMessageRead, subscription?.alert, subscription?.unread, subscribed]);

	useEffect(() => {
		if (!unread?.count) {
			return debouncedMessageRead();
		}
	}, [debouncedMessageRead, room._id, unread?.count]);

	return {
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread?.count ?? 0, unread?.since] as const,
		setUnreadCount,
		setLastMessageDate,
		debouncedMessageRead,
	};
};
