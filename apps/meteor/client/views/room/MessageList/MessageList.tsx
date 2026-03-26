import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { VirtualScrollbars } from '@rocket.chat/ui-client';
import { useSearchParameter, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ScrollToOptions } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Virtualizer } from '@tanstack/virtual-core';
import type { ComponentProps, MutableRefObject, Ref, RefObject } from 'react';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { VirtualizedMessageList } from './VirtualizedMessageList';
import LoadingMessagesIndicator from '../body/LoadingMessagesIndicator';
import RetentionPolicyWarning from '../body/RetentionPolicyWarning';
import RoomForeword from '../body/RoomForeword/RoomForeword';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import MessageListProvider from './providers/MessageListProvider';
import { setHighlightMessage } from './providers/messageHighlightSubscription';

export type VirtualizerHandle = {
	scrollToIndex: (index: number, opts?: ScrollToOptions) => void;
	scrollToOffset: (offset: number, opts?: ScrollToOptions) => void;
	scrollToEnd: (opts?: ScrollToOptions) => void;
	getTotalSize: () => number;
	isAtBottom: (threshold?: number) => boolean;
};

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
	virtualizerRef?: RefObject<VirtualizerHandle | null>;
	isLoadingMoreMessages: boolean;
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	user: IUser | null;
	room: IRoom;
	retentionPolicy: RetentionPolicy;
	innerRef: Ref<HTMLElement>;
	atBottomRef: MutableRefObject<boolean>;
	onGetMore: () => Promise<void>;
	onGetMoreNext: () => Promise<void>;
};

const ESTIMATE_SIZE = 84;
const OVERSCAN = 5;
const DEFAULT_MAX_RENDERED = 50;
const AT_BOTTOM_THRESHOLD = 50;

export const MessageList = function MessageList({
	rid,
	messageListRef,
	scrollContainerRef,
	virtualizerRef,
	isLoadingMoreMessages,
	canPreview,
	hasMorePreviousMessages,
	hasMoreNextMessages,
	user,
	room,
	retentionPolicy,
	innerRef,
	atBottomRef,
	onGetMore,
	onGetMoreNext,
}: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const { t } = useTranslation();

	const overscan = Math.min(OVERSCAN, Math.max(0, Math.floor(DEFAULT_MAX_RENDERED / 2) - 2));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	// Stable ref pattern: keeps latest values accessible inside onChange without stale-closure issues.
	// Updated synchronously on every render so onChange always sees current props/state.
	const loadCtxRef = useRef({
		hasMorePreviousMessages,
		hasMoreNextMessages,
		isLoadingMoreMessages,
		messages,
		onGetMore,
		onGetMoreNext,
		atBottomRef,
	});
	loadCtxRef.current = {
		hasMorePreviousMessages,
		hasMoreNextMessages,
		isLoadingMoreMessages,
		messages,
		onGetMore,
		onGetMoreNext,
		atBottomRef,
	};

	const jumpToMessageParam = useSearchParameter('msg');
	// Keep latest jumpToMessageParam accessible inside the stable onChange without triggering re-creation.
	const jumpToMessageParamRef = useRef(jumpToMessageParam);
	jumpToMessageParamRef.current = jumpToMessageParam;

	// Guards concurrent fetches — a simple boolean ref is sufficient since
	// all reads/writes happen on the main thread inside onChange.
	const isFetchingRef = useRef(false);
	// Remembers the _id of the first visible message before a user-triggered prepend so we
	// can restore the viewport to that message after the new messages are rendered.
	const firstVisibleIdRef = useRef<string | null>(null);
	// Set to true during the initial load (no messages existed before the fetch).
	// The scroll-restore effect uses this to scroll to the newest message instead of an anchor,
	// and onChange uses it to avoid cascading getMore calls while the scroll is pending.
	const shouldScrollToEndRef = useRef(false);

	const handleChange = useCallback((instance: Virtualizer<HTMLElement, Element>) => {
		const ctx = loadCtxRef.current;

		// Maintain atBottomRef via virtualizer state (replaces the DOM scroll listener
		// in useListIsAtBottom that called isAtBottomLib on the scroll container).
		const { scrollOffset, scrollRect } = instance;
		if (scrollOffset !== null && scrollRect !== null) {
			ctx.atBottomRef.current = scrollOffset + scrollRect.height >= instance.getTotalSize() - AT_BOTTOM_THRESHOLD;
		}

		// Initial-load scroll-to-end: execute as soon as the scroll element is measured.
		// scrollOffset === null means the element isn't ready yet — keep the flag and wait.
		// Doing this here (rather than in a useEffect) guarantees the element is available
		// and prevents onChange from cascading into spurious getMore calls before we've scrolled.
		if (shouldScrollToEndRef.current) {
			if (scrollOffset !== null && ctx.messages.length > 0) {
				instance.scrollToIndex(ctx.messages.length - 1, { align: 'end' });
				shouldScrollToEndRef.current = false;
			}
			return;
		}

		// Anchor restore after user-triggered prepend: scroll back to the saved message
		// before falling through to any further getMore logic so we don't cascade.
		// This runs in onChange (not useEffect) so it fires before the next getMore check.
		if (firstVisibleIdRef.current) {
			const anchorIndex = ctx.messages.findIndex((m) => m._id === firstVisibleIdRef.current);
			firstVisibleIdRef.current = null;
			if (anchorIndex >= 0) {
				instance.scrollToIndex(anchorIndex, { align: 'start' });
			}
			return;
		}

		if (ctx.isLoadingMoreMessages || isFetchingRef.current || jumpToMessageParamRef.current) {
			return;
		}

		const items = instance.getVirtualItems();

		if ((items.length === 0 || items[0].index === 0) && ctx.hasMorePreviousMessages) {
			if (ctx.messages.length > 0) {
				// User scrolled to top: save the anchor so we can restore viewport position
				// after the prepended messages are rendered (replaces restoreScroll DOM arithmetic).
				firstVisibleIdRef.current = ctx.messages[0]?._id ?? null;
			} else {
				// No messages yet — this is the initial load. After messages arrive we scroll
				// to the newest (bottom) instead of restoring an anchor.
				shouldScrollToEndRef.current = true;
			}
			isFetchingRef.current = true;
			ctx.onGetMore().finally(() => {
				isFetchingRef.current = false;
			});
			return;
		}

		if (items[items.length - 1].index >= ctx.messages.length - 1 && ctx.hasMoreNextMessages) {
			isFetchingRef.current = true;
			ctx.onGetMoreNext().finally(() => {
				isFetchingRef.current = false;
			});
		}
	}, []);

	// Safety net for the initial load: onChange may not fire when count=0 and the scroll
	// container has not been sized yet. This effect mirrors what the old ResizeObserver
	// in useGetMore did on element mount.
	useEffect(() => {
		if (messages.length > 0 || isLoadingMoreMessages || isFetchingRef.current || !hasMorePreviousMessages) {
			return;
		}
		shouldScrollToEndRef.current = true;
		isFetchingRef.current = true;
		onGetMore().finally(() => {
			isFetchingRef.current = false;
		});
	}, [hasMorePreviousMessages, isLoadingMoreMessages, messages.length, onGetMore]);

	const virtualizer = useVirtualizer<HTMLElement, Element>({
		count: messages?.length ?? 0,
		getScrollElement: () => scrollContainerRef?.current ?? null,
		estimateSize: () => ESTIMATE_SIZE,
		overscan,
		getItemKey: (index: number) => messages[index]?._id ?? index,
		initialOffset: Infinity,
		onChange: handleChange,
	});

	useImperativeHandle(
		virtualizerRef,
		() => ({
			scrollToIndex: (...args: Parameters<typeof virtualizer.scrollToIndex>) => virtualizer.scrollToIndex(...args),
			scrollToOffset: (...args: Parameters<typeof virtualizer.scrollToOffset>) => virtualizer.scrollToOffset(...args),
			scrollToEnd: (opts) => virtualizer.scrollToIndex(virtualizer.options.count - 1, { align: 'end', ...opts }),
			getTotalSize: () => virtualizer.getTotalSize(),
			isAtBottom: (threshold = 0) => {
				const { scrollOffset, scrollRect } = virtualizer;
				if (scrollOffset === null || scrollRect === null) {
					return true;
				}
				return scrollOffset + scrollRect.height >= virtualizer.getTotalSize() - threshold;
			},
		}),
		[virtualizer],
	);

	const jumpedToMsgRef = useRef<string | null>(null);

	useEffect(() => {
		if (!jumpToMessageParam) {
			jumpedToMsgRef.current = null;
			return;
		}
		if (jumpedToMsgRef.current === jumpToMessageParam) {
			return;
		}
		const index = messages.findIndex((m) => m._id === jumpToMessageParam);
		if (index === -1) {
			return;
		}
		virtualizer.scrollToIndex(index, { align: 'center' });
		setHighlightMessage(jumpToMessageParam);
		jumpedToMsgRef.current = jumpToMessageParam;
	}, [jumpToMessageParam, messages, virtualizer]);

	const totalSize = virtualizer.getTotalSize();
	const virtualItems = virtualizer.getVirtualItems();

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<VirtualScrollbars ref={innerRef} viewportRef={scrollContainerRef} key={room._id}>
					<ul
						className='messages-list'
						aria-label={t('Message_list')}
						aria-busy={isLoadingMoreMessages}
						style={{ height: `${totalSize}px` }}
					>
						{canPreview ? (
							<>
								{hasMorePreviousMessages ? (
									<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
								) : (
									<li>
										<RoomForeword user={user} room={room} />
										{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
									</li>
								)}
							</>
						) : null}
						{messages.length > 0 && (
							<VirtualizedMessageList
								rid={rid}
								messages={messages}
								scrollContainerRef={scrollContainerRef}
								messageGroupingPeriod={messageGroupingPeriod}
								firstUnreadMessageId={firstUnreadMessageId}
								showUserAvatar={showUserAvatar}
								subscription={subscription}
								virtualItems={virtualItems}
								virtualizer={virtualizer}
							/>
						)}
						{hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null}
					</ul>
				</VirtualScrollbars>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
