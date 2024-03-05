import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
import { LegacyRoomManager, RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withDebouncing, withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { useChat } from '../../contexts/ChatContext';

interface IUnreadMessages {
	count: number;
	since: Date;
}

export const useUnreadMessages = (
	room: IRoom,
): readonly [data: IUnreadMessages | undefined, setUnreadCount: Dispatch<SetStateAction<number>>] => {
	const notLoadedCount = useReactiveValue(useCallback(() => RoomHistoryManager.getRoom(room._id).unreadNotLoaded.get(), [room._id]));
	const [loadedCount, setLoadedCount] = useState(0);

	const count = useMemo(() => notLoadedCount + loadedCount, [notLoadedCount, loadedCount]);

	const since = useReactiveValue(useCallback(() => LegacyRoomManager.getOpenedRoomByRid(room._id)?.unreadSince.get(), [room._id]));

	return useMemo(() => {
		if (count && since) {
			return [{ count, since }, setLoadedCount];
		}

		return [undefined, setLoadedCount];
	}, [count, since]);
};

export const useHandleUnread = (room: IRoom, subscription?: ISubscription) => {
	const messagesBoxRef = useRef<HTMLDivElement>(null);

	const subscribed = Boolean(subscription);
	const [unread, setUnreadCount] = useUnreadMessages(room);

	const [lastMessageDate, setLastMessageDate] = useState<Date | undefined>();

	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}
	const handleUnreadBarJumpToButtonClick = useCallback(() => {
		const rid = room._id;
		const { firstUnread } = RoomHistoryManager.getRoom(rid);
		let message = firstUnread?.get();
		if (!message) {
			message = ChatMessage.findOne({ rid, ts: { $gt: unread?.since } }, { sort: { ts: 1 }, limit: 1 });
		}
		if (!message) {
			return;
		}
		setMessageJumpQueryStringParameter(message?._id);
		setUnreadCount(0);
	}, [room._id, unread?.since, setUnreadCount]);

	const handleMarkAsReadButtonClick = useCallback(() => {
		chat.readStateManager.markAsRead();
		setUnreadCount(0);
	}, [chat.readStateManager, setUnreadCount]);

	useEffect(() => {
		if (!subscribed) {
			setUnreadCount(0);
			return;
		}

		const count = ChatMessage.find({
			rid: room._id,
			ts: { $lte: lastMessageDate, $gt: subscription?.ls },
		}).count();

		setUnreadCount(count);
	}, [lastMessageDate, room._id, setUnreadCount, subscribed, subscription?.ls]);

	const router = useRouter();

	const debouncedReadMessageRead = useMemo(
		() =>
			withDebouncing({ wait: 500 })(() => {
				chat.readStateManager.attemptMarkAsRead();
			}),
		[chat.readStateManager],
	);

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				const routeName = router.getRouteName();
				if (!routeName || !roomCoordinator.isRouteNameKnown(routeName)) {
					return;
				}

				debouncedReadMessageRead();
			}),
		[debouncedReadMessageRead, room._id, router, subscribed, subscription?.alert, subscription?.unread],
	);

	useEffect(() => {
		if (!unread?.count) {
			return debouncedReadMessageRead();
		}
	}, [debouncedReadMessageRead, room._id, unread?.count]);

	const ref = useCallback(
		(wrapper: HTMLDivElement | null) => {
			if (!wrapper) {
				return;
			}

			const getElementFromPoint = (topOffset = 0): Element | undefined => {
				const messagesBox = messagesBoxRef.current;

				if (!messagesBox) {
					return;
				}

				const messagesBoxLeft = messagesBox.getBoundingClientRect().left + window.pageXOffset;
				const messagesBoxTop = messagesBox.getBoundingClientRect().top + window.pageYOffset;
				const messagesBoxWidth = parseFloat(getComputedStyle(messagesBox).width);

				let element;
				if (document.dir === 'rtl') {
					element = document.elementFromPoint(messagesBoxLeft + messagesBoxWidth - 1, messagesBoxTop + topOffset + 1);
				} else {
					element = document.elementFromPoint(messagesBoxLeft + 1, messagesBoxTop + topOffset + 1);
				}

				if (element?.classList.contains('rcx-message') || element?.classList.contains('rcx-message--sequential')) {
					return element;
				}
			};
			wrapper.addEventListener(
				'scroll',
				withThrottling({ wait: 300 })(() => {
					Tracker.afterFlush(() => {
						const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

						if (!lastInvisibleMessageOnScreen) {
							setUnreadCount(0);
							return;
						}

						const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
						if (!lastMessage) {
							setUnreadCount(0);
							return;
						}

						setLastMessageDate(lastMessage.ts);
					});
				}),
			);
		},
		[setUnreadCount],
	);

	return {
		ref,
		messagesBoxRef,
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread?.count, unread?.since] as const,
	};
};
