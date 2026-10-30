import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { MessageTypes } from '@rocket.chat/message-types';
import { useSearchParameter, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { VirtualizerHandle } from 'virtua';
import { VList } from 'virtua';

import { MessageListItem } from './MessageListItem';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useIsSelecting, useSelectedMessageStore } from './contexts/SelectedMessagesContext';
import { useMessages } from './hooks/useMessages';
import useTryToJumpToMessage from './hooks/useTryToJumpToMessage';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';
import { RoomManager } from '../../../lib/RoomManager';
import LoadingMessagesIndicator from '../body/LoadingMessagesIndicator';
import RetentionPolicyWarning from '../body/RetentionPolicyWarning';
import RoomForeword from '../body/RoomForeword/RoomForeword';
import { useStoreScrollPosition } from '../body/hooks/useStoreScrollPosition';
import { useChat } from '../contexts/ChatContext';
import type { RetentionPolicy } from '../hooks/useRetentionPolicy';
import { useKeepMountedMessages } from './hooks/useKeepMountedMessages';

export type MessageListProps = {
	rid: IRoom['_id'];
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	isLoadingMoreMessages: boolean;
	user: IUser | null;
	room: IRoom;
	retentionPolicy: RetentionPolicy | undefined;
	hasMoreNextMessages: boolean;
	shouldJumpToBottom: boolean;
	isAtBottom: MutableRefObject<boolean>;
	isJumpingToMessage: boolean;
	setIsJumpingToMessage: Dispatch<SetStateAction<boolean>>;
	setUnreadCount: Dispatch<SetStateAction<number>>;
	setLastMessageDate: Dispatch<SetStateAction<Date | undefined>>;
	debouncedClearNewMessagesOnScroll: () => void;
	handleDateScroll: (topMessage: IMessage | undefined, offset: number) => void;
	setShouldJumpToBottom: Dispatch<SetStateAction<boolean>>;
	debouncedMessageRead: () => void;
	setKeepAtBottom: (keepAtBottom: () => void) => void;
};

export const MessageList = function MessageList({
	rid,
	canPreview,
	hasMorePreviousMessages,
	isLoadingMoreMessages,
	user,
	room,
	retentionPolicy,
	hasMoreNextMessages,
	shouldJumpToBottom,
	setShouldJumpToBottom,
	isAtBottom,
	isJumpingToMessage,
	setIsJumpingToMessage,
	setUnreadCount,
	setLastMessageDate,
	debouncedClearNewMessagesOnScroll,
	handleDateScroll,
	debouncedMessageRead,
	setKeepAtBottom,
}: MessageListProps) {
	// Prepend ref needed for adjusting the message list shift
	// https://inokawa.github.io/virtua/?path=/story/advanced-chat--default
	const isPrepend = useRef<boolean>(false);
	useLayoutEffect(() => {
		isPrepend.current = false;
		// FIXME: isAtBottom should be better calculated, as it does no alwas represent the correct value
		if (hasMoreNextMessages) {
			isAtBottom.current = false;
		}
	});

	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const lastScrollSizeRef = useRef(0);

	const messages = useMessages({ rid });
	const isSelecting = useIsSelecting();
	const selectedMessageStore = useSelectedMessageStore();

	useEffect(() => {
		if (!isSelecting) {
			return;
		}

		selectedMessageStore.setAvailableMessages(messages.map((message) => message._id));
	}, [isSelecting, messages, selectedMessageStore]);

	// Virtua's cache is positional, so only reuse it when the message count still matches the one it was captured against.
	const initialCacheRef = useRef(
		(() => {
			const store = RoomManager.getStore(rid);
			return store?.cacheMessageCount === messages.length ? store.cache : undefined;
		})(),
	);

	const messagesLength = canPreview ? messages.length + 1 : messages.length;

	useEffect(() => {
		setKeepAtBottom(() => {
			if (virtualizerRef.current) {
				virtualizerRef.current.scrollToIndex(messagesLength, {
					align: 'end',
				});
			}
		});
	}, [messagesLength, setKeepAtBottom]);

	const keepMountedMessages = useKeepMountedMessages(messages, canPreview);

	useTryToJumpToMessage({ rid, virtualizerRef, setIsJumpingToMessage, messages });

	const handlePrepend = useCallback(
		(offset: number) => {
			if (!isRoomInitialized.current) {
				return;
			}
			// If the offset is less than 200, it means the user is reaching the top of the list,
			// so the prepend need to be enabled for smooth scrolling,
			// if the prepend is enabled when a new message is added, the list will misalign.
			if (offset < 200) {
				isPrepend.current = true;
			}

			const scrollSize = virtualizerRef.current?.scrollSize ?? 0;
			const viewportSize = virtualizerRef.current?.viewportSize ?? 0;

			if (hasMoreNextMessages) {
				isAtBottom.current = false;
				return;
			}

			if (scrollSize >= viewportSize) {
				isAtBottom.current = true;
			}

			isAtBottom.current = offset - scrollSize + viewportSize >= -60;
			if (shouldJumpToBottom && isAtBottom.current) {
				setShouldJumpToBottom(false);
			}
		},
		[isAtBottom, setShouldJumpToBottom, shouldJumpToBottom, hasMoreNextMessages],
	);

	const isRoomInitialized = useRef<boolean>(false);

	const firstUnreadMessageId = useFirstUnreadMessageId();
	const subscription = useRoomSubscription();
	// The first unread id may only be computed after the room is initialized, so the messages already listed are checked too.
	const hasUnseenMessages = useMemo(() => {
		const lastSeen = subscription?.ls?.getTime();
		if (lastSeen === undefined) {
			return false;
		}
		for (let i = messages.length - 1; i >= 0 && messages[i].ts.getTime() > lastSeen; i--) {
			const message = messages[i];
			if (message.u._id !== user?._id && (!message.tmid || message.tshow)) {
				return true;
			}
		}
		return false;
	}, [messages, subscription?.ls, user?._id]);
	const hasUnreadMessages = Boolean(firstUnreadMessageId || hasUnseenMessages);

	const messageJumpParam = useSearchParameter('msg');

	// Scroll to bottom
	useEffect(() => {
		if (isJumpingToMessage || messageJumpParam) {
			if (!isRoomInitialized.current) {
				// Jump to message will have to load messages, thus removing the need to initialize the room here
				isRoomInitialized.current = true;
				setShouldJumpToBottom(false);
			}
			return;
		}

		if (!isRoomInitialized.current) {
			const store = RoomManager.getStore(rid);

			if (!store) {
				return;
			}

			if (!store?.atBottom && store?.scroll !== undefined) {
				// When unreads are present, always scroll to bottom
				if (hasUnreadMessages) {
					isRoomInitialized.current = true;
					setShouldJumpToBottom(true);
					return;
				}

				setShouldJumpToBottom(false);

				virtualizerRef.current?.scrollTo(store?.scroll);
				isAtBottom.current = false;
				isRoomInitialized.current = true;
				return;
			}
			setShouldJumpToBottom(true);
			isRoomInitialized.current = true;
		}

		const handle = virtualizerRef.current;
		const lastItemIndex = messages.length - 1;
		if (shouldJumpToBottom === true) {
			// When new messages arrive, this effect is triggered, but the latest message is not on the index, so it scrolls to the previous index
			// TODO: Find if there is a better way to scroll to the latest message
			handle?.scrollToIndex(lastItemIndex + 1, {
				align: 'center',
			});
		}
		// If new messages arrive and is at bottom, scroll to keep at bottom.
		if (isAtBottom.current && lastScrollSizeRef.current !== handle?.scrollSize && !isLoadingMoreMessages) {
			lastScrollSizeRef.current = handle?.scrollSize ?? 0;
			handle?.scrollToIndex(lastItemIndex + 1, {
				align: 'end',
			});
		}
	}, [
		isAtBottom,
		messages,
		shouldJumpToBottom,
		isJumpingToMessage,
		isLoadingMoreMessages,
		messageJumpParam,
		rid,
		hasUnreadMessages,
		setShouldJumpToBottom,
	]);

	const storeScrollPosition = useStoreScrollPosition({ rid, isAtBottom, virtualizerRef, messagesLength: messages.length });

	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const { t } = useTranslation();

	const unreadMarkIndex = useRef<number | null>(null);
	const chat = useChat();

	const isUnreadMarkVisible = useCallback(() => {
		if (unreadMarkIndex.current === null) {
			return false;
		}
		const handle = virtualizerRef.current;
		if (!handle) {
			return false;
		}
		const listIndexOffset = canPreview ? 1 : 0;
		const markListIndex = listIndexOffset + unreadMarkIndex.current;
		const viewStartIndex = handle.findItemIndex(handle.scrollOffset);
		const viewEndIndex = handle.findItemIndex(handle.scrollOffset + handle.viewportSize);
		const minIndex = Math.min(viewStartIndex, viewEndIndex);
		const maxIndex = Math.max(viewStartIndex, viewEndIndex);
		const isVisible = markListIndex >= minIndex && markListIndex <= maxIndex;
		return isVisible;
	}, [canPreview]);

	useEffect(() => {
		if (chat) {
			chat.readStateManager.setIsUnreadMarkVisibleCallback(isUnreadMarkVisible);
		}
	}, [chat, isUnreadMarkVisible]);

	const getTopVisibleMessage = useCallback((): IMessage | undefined => {
		const handle = virtualizerRef.current;
		if (!handle) {
			return undefined;
		}
		const viewportTopPadding = 21; // TODO: we should derive this value from somewhere else.
		return messages[handle.findItemIndex(handle.scrollOffset - viewportTopPadding) - (canPreview ? 1 : 0)];
	}, [messages, canPreview]);

	const updateTopVisibleMessage = useDebouncedCallback(
		() => {
			const topMessage = getTopVisibleMessage();
			if (!topMessage) {
				setUnreadCount(0);
				return;
			}
			setLastMessageDate(topMessage.ts);
		},
		300,
		[getTopVisibleMessage, setUnreadCount, setLastMessageDate],
	);

	// The unread bubble must be counted even when the list settles without the user scrolling.
	useEffect(() => {
		updateTopVisibleMessage();
	}, [messages, firstUnreadMessageId, updateTopVisibleMessage]);

	unreadMarkIndex.current = null;

	return (
		<MessageListProvider>
			<SelectedMessagesProvider>
				<VList
					ref={virtualizerRef}
					shift={isPrepend.current === true}
					style={{ height: '100%' }}
					aria-label={t('Message_list')}
					aria-busy={isLoadingMoreMessages}
					role='list'
					className='messages-list'
					keepMounted={keepMountedMessages}
					cache={initialCacheRef.current}
					onScroll={(offset: number) => {
						handlePrepend(offset);
						storeScrollPosition();
						debouncedClearNewMessagesOnScroll();

						updateTopVisibleMessage();
						handleDateScroll(getTopVisibleMessage(), offset);
						debouncedMessageRead();
					}}
				>
					{canPreview ? (
						<>
							{hasMorePreviousMessages ? (
								<div className='load-more' role='presentation'>
									{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}
								</div>
							) : (
								<div role='listitem'>
									<RoomForeword user={user} room={room} />
									{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
								</div>
							)}
						</>
					) : null}
					{messages.map((message, index, { [index - 1]: previous }) => {
						const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
						const showUnreadDivider = firstUnreadMessageId === message._id;
						const system = MessageTypes.isSystemMessage(message);
						const visible = !isThreadMessage(message) && !system;

						if (showUnreadDivider) {
							unreadMarkIndex.current = index;
						}

						return (
							<Fragment key={message._id}>
								<MessageListItem
									message={message}
									previous={previous}
									showUnreadDivider={showUnreadDivider}
									showUserAvatar={showUserAvatar}
									sequential={sequential}
									visible={visible}
									subscription={subscription}
									system={system}
								/>
							</Fragment>
						);
					})}
					{hasMoreNextMessages ? (
						<div className='load-more' role='presentation'>
							{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}
						</div>
					) : null}
				</VList>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
