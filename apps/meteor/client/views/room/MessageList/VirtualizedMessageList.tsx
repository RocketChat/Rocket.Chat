import type { IRoom, IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { VirtualScrollbars } from '@rocket.chat/ui-client';
import { useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import type { ScrollToOptions, VirtualItem } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MutableRefObject, Ref } from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageListItem } from './MessageListItem';
import { isMessageSequential } from './lib/isMessageSequential';
import { setHighlightMessage, clearHighlightMessage } from './providers/messageHighlightSubscription';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import type { VirtualizerHandle } from '../../../components/message/list/MessageListContext';
import { useMessageListVirtualizer } from '../../../components/message/list/MessageListContext';
import LoadingMessagesIndicator from '../body/LoadingMessagesIndicator';
import RetentionPolicyWarning from '../body/RetentionPolicyWarning';
import RoomForeword from '../body/RoomForeword/RoomForeword';

export type { VirtualizerHandle };

const ESTIMATE_SIZE = 84;
const OVERSCAN = 5;
const DEFAULT_MAX_RENDERED = 50;

type VirtualizedMessageListProps = {
	rid: IRoom['_id'];
	messages: IMessage[];
	scrollContainerRef?: MutableRefObject<HTMLElement | null>;
	messageGroupingPeriod: number;
	firstUnreadMessageId: string | undefined;
	showUserAvatar: boolean;
	subscription: ISubscription | undefined;
	innerRef: Ref<HTMLElement>;
	isLoadingMoreMessages: boolean;
	canPreview: boolean;
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	user: IUser | null;
	room: IRoom;
	retentionPolicy: RetentionPolicy;
};

export function VirtualizedMessageList({
	rid,
	messages,
	scrollContainerRef,
	messageGroupingPeriod,
	firstUnreadMessageId,
	showUserAvatar,
	subscription,
	innerRef,
	isLoadingMoreMessages,
	canPreview,
	hasMorePreviousMessages,
	hasMoreNextMessages,
	user,
	room,
	retentionPolicy,
}: VirtualizedMessageListProps) {
	const { t } = useTranslation();
	const router = useRouter();

	const overscan = Math.min(OVERSCAN, Math.max(0, Math.floor(DEFAULT_MAX_RENDERED / 2) - 2));

	const virtualizer = useVirtualizer<HTMLElement, Element>({
		count: messages?.length ?? 0,
		getScrollElement: () => scrollContainerRef?.current ?? null,
		estimateSize: () => ESTIMATE_SIZE,
		overscan,
		getItemKey: (index: number) => messages[index]?._id ?? index,
		initialOffset: Infinity,
	});

	const contextVirtualizerRef = useMessageListVirtualizer();
	useImperativeHandle(
		contextVirtualizerRef,
		() => ({
			scrollToIndex: (...args: Parameters<typeof virtualizer.scrollToIndex>) => virtualizer.scrollToIndex(...args),
			scrollToOffset: (...args: Parameters<typeof virtualizer.scrollToOffset>) => virtualizer.scrollToOffset(...args),
			scrollToEnd: (opts?: ScrollToOptions) => virtualizer.scrollToIndex(virtualizer.options.count - 1, { align: 'end', ...opts }),
			getTotalSize: () => virtualizer.getTotalSize(),
			isAtBottom: () => virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.index === virtualizer.options.count - 1,
		}),
		[virtualizer],
	);

	const totalSize = virtualizer.getTotalSize();
	const virtualItems = virtualizer.getVirtualItems();

	const jumpToMessageParam = useSearchParameter('msg');
	const jumpedToMsgRef = useRef<string | null>(null);

	const jumpToMessageParamRef = useRef(jumpToMessageParam);
	jumpToMessageParamRef.current = jumpToMessageParam;

	// Guards concurrent fetches.
	const isFetchingRef = useRef(false);
	// Saves the first visible message _id before a prepend so we can restore the viewport afterward.
	const firstVisibleIdRef = useRef<string | null>(null);
	// Set during the initial load so the scroll restoration effect scrolls to bottom once messages arrive.
	const shouldScrollToEndRef = useRef(false);

	// TODO: Change is at bottom to call the virutalize callback instead of updating a ref all the time
	// Update atBottomRef from virtualizer state — no DOM read required.
	// useEffect(() => {
	// 	if (scrollRectHeight !== null && scrollOffset !== null) {
	// 		atBottomRef.current = scrollOffset + scrollRectHeight >= totalSize - AT_BOTTOM_THRESHOLD;
	// 	}
	// }, [atBottomRef, scrollOffset, scrollRectHeight, totalSize]);

	// Trigger loading previous messages when the first item is visible (index === 0).
	useEffect(() => {
		if (isLoadingMoreMessages || isFetchingRef.current || jumpToMessageParamRef.current) {
			return;
		}

		const firstItem = virtualItems[0];
		if ((virtualItems.length === 0 || firstItem?.index === 0) && hasMorePreviousMessages) {
			if (messages.length > 0) {
				firstVisibleIdRef.current = messages[0]?._id ?? null;
			} else {
				shouldScrollToEndRef.current = true;
			}
			isFetchingRef.current = true;
			RoomHistoryManager.getMore(rid).finally(() => {
				isFetchingRef.current = false;
			});
		}
	}, [virtualItems, hasMorePreviousMessages, isLoadingMoreMessages, messages, rid]);

	// Trigger loading next messages when the last item is visible.
	useEffect(() => {
		if (isLoadingMoreMessages || isFetchingRef.current || jumpToMessageParamRef.current) {
			return;
		}

		const lastItem = virtualItems[virtualItems.length - 1];
		if (lastItem && lastItem.index >= messages.length - 1 && hasMoreNextMessages) {
			isFetchingRef.current = true;
			RoomHistoryManager.getMoreNext(rid).finally(() => {
				isFetchingRef.current = false;
			});
		}
	}, [virtualItems, hasMoreNextMessages, isLoadingMoreMessages, messages.length, rid]);

	// Scroll restoration: runs after messages update following a prepend or initial load.
	useEffect(() => {
		if (shouldScrollToEndRef.current && messages.length > 0) {
			virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
			shouldScrollToEndRef.current = false;
			return;
		}

		if (firstVisibleIdRef.current) {
			const anchorIndex = messages.findIndex((m) => m._id === firstVisibleIdRef.current);
			firstVisibleIdRef.current = null;
			if (anchorIndex >= 0) {
				virtualizer.scrollToIndex(anchorIndex, { align: 'start' });
			}
		}
	}, [messages, virtualizer, firstVisibleIdRef, shouldScrollToEndRef]);

	const isSurroundingLoadingRef = useRef(false);

	useEffect(() => {
		if (!jumpToMessageParam) {
			jumpedToMsgRef.current = null;
			isSurroundingLoadingRef.current = false;
			return;
		}
		if (jumpedToMsgRef.current === jumpToMessageParam) {
			return;
		}
		const index = messages.findIndex((m) => m._id === jumpToMessageParam);
		if (index === -1) {
			// Message not in current window — load surrounding messages.
			// getSurroundingMessages is idempotent; safe to call even if
			// useLoadSurroundingMessages already triggered it.
			if (!isSurroundingLoadingRef.current) {
				isSurroundingLoadingRef.current = true;
				RoomHistoryManager.getSurroundingMessages({ _id: jumpToMessageParam, rid }).finally(() => {
					isSurroundingLoadingRef.current = false;
				});
			}
			return;
		}
		// Message is loaded — scroll to it, then clear the ?msg= param.
		virtualizer.scrollToIndex(index, { align: 'center' });
		setHighlightMessage(jumpToMessageParam);
		jumpedToMsgRef.current = jumpToMessageParam;
		const { msg: _, ...search } = router.getSearchParameters();
		router.navigate({ pathname: router.getLocationPathname(), search }, { replace: true });
		setTimeout(clearHighlightMessage, 2000);
	}, [jumpToMessageParam, messages, virtualizer, rid, router]);

	return messages.length > 0 ? (
		<VirtualScrollbars ref={innerRef} viewportRef={scrollContainerRef} key={room._id}>
			<ul className='messages-list' aria-label={t('Message_list')} aria-busy={isLoadingMoreMessages} style={{ height: `${totalSize}px` }}>
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

				{messages.length > 0 &&
					virtualItems.map((virtualRow: VirtualItem) => {
						const message = messages[virtualRow.index];
						if (!message) {
							return null;
						}
						const previous = messages[virtualRow.index - 1];
						const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
						const showUnreadDivider = firstUnreadMessageId === message._id;
						const system = MessageTypes.isSystemMessage(message);
						const visible = !isThreadMessage(message) && !system;

						return (
							<Box
								key={virtualRow.key}
								data-index={virtualRow.index}
								ref={virtualizer.measureElement}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
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
							</Box>
						);
					})}

				{hasMoreNextMessages ? <li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li> : null}
			</ul>
		</VirtualScrollbars>
	) : null;
}
