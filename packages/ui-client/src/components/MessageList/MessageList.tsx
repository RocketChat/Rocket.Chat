import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Throbber } from '@rocket.chat/fuselage';
import { useMergedRefsV2, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, Ref } from 'react';
import { useCallback, useImperativeHandle, useMemo } from 'react';

import MessageListRow from './MessageListRow';
import type { MessageListScrollContextValue } from './MessageListScrollContext';
import { MessageListScrollContext } from './MessageListScrollContext';
import MessageListVirtualizer from './MessageListVirtualizer';
import type { MessageRowStateContextValue } from './MessageRowStateContext';
import { MessageRowStateContext } from './MessageRowStateContext';
import { hasLiveEmbed } from './hasLiveEmbed';
import type { MessageListMessageRow } from './lib/buildMessageListRows';
import { buildMessageListRows } from './lib/buildMessageListRows';
import type { MessageListPosition } from './lib/position';
import type { MessageListVisibility } from './scroll/useMessageListScroller';
import { useMessageListScroller } from './scroll/useMessageListScroller';
import { useMessageListNavigation } from '../../hooks/useMessageListNavigation';
import { useViewportScrollbars, viewportScrollbarsHostStyle } from '../CustomScrollbars/useViewportScrollbars';

export type MessageListHandle<TMessage extends IMessage = IMessage> = {
	scrollToBottom: () => void;
	scrollToTop: () => void;
	scrollToMessage: (messageId: string) => void;
	/** What the viewer sees now, for callers that ask at their own time instead of listening. */
	getVisibility: () => MessageListVisibility<TMessage> | undefined;
};

export type MessageListProps<TMessage extends IMessage> = {
	'ref'?: Ref<MessageListHandle<TMessage>>;
	'aria-label': string;
	/** Sorted oldest first. */
	'messages': readonly TMessage[];
	'hasOlderMessages'?: boolean;
	'hasNewerMessages'?: boolean;
	'isLoadingOlderMessages'?: boolean;
	'isLoadingNewerMessages'?: boolean;
	'isLoadingInitialMessages'?: boolean;
	/** Settles once the older page is in `messages`, or failed to load. */
	'onLoadOlderMessages'?: () => Promise<unknown> | void;
	'onLoadNewerMessages'?: () => Promise<unknown> | void;
	/** Replaces an older window of the conversation with its latest page. */
	'onJumpToLatest'?: () => Promise<unknown> | void;
	'firstUnreadMessageId'?: string;
	/** A message to scroll to and highlight; when it is not in `messages`, the consumer loads the messages around it. */
	'targetMessageId'?: string;
	'onTargetMessageReached'?: (messageId: string) => void;
	'isOwnMessage'?: (message: TMessage) => boolean;
	'groupingPeriodSeconds'?: number;
	/** Whether thread replies show as previews of their thread, as in a room. */
	'groupsThreadReplies'?: boolean;
	/** Where the list was left, as reported by `onPositionChange`. The list must be keyed by conversation to restore it. */
	'restoredPosition'?: MessageListPosition;
	'onPositionChange'?: (position: MessageListPosition) => void;
	'onVisibleMessagesChange'?: (visibility: MessageListVisibility<TMessage>) => void;
	/** Messages that stay mounted out of view, because mounting them again would reload them. */
	'shouldKeepMounted'?: (message: TMessage) => boolean;
	/** Shown above the first message once no older messages remain. */
	'header'?: ReactNode;
	'renderMessage': (row: MessageListMessageRow<TMessage>) => ReactNode;
	/** Overlay parts, such as `MessageListDateBubble`. */
	'children'?: ReactNode;
};

const viewportStyle = css`
	position: relative;
	height: 100%;
	overflow-y: auto;
	overflow-anchor: none;
	overscroll-behavior: contain;
`;

const contentStyle = css`
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	min-height: 100%;
`;

const never = () => false;

/**
 * An infinite list of messages that opens on the latest one, keeps the viewer where they are while pages load and messages
 * arrive, and jumps to any message. It renders the rows; `renderMessage` renders each message.
 */
const MessageList = <TMessage extends IMessage>({
	ref,
	'aria-label': ariaLabel,
	messages,
	hasOlderMessages = false,
	hasNewerMessages = false,
	isLoadingOlderMessages = false,
	isLoadingNewerMessages = false,
	isLoadingInitialMessages = false,
	onLoadOlderMessages,
	onLoadNewerMessages,
	onJumpToLatest,
	firstUnreadMessageId,
	targetMessageId,
	onTargetMessageReached,
	isOwnMessage = never,
	groupingPeriodSeconds = 300,
	groupsThreadReplies = true,
	restoredPosition,
	onPositionChange,
	onVisibleMessagesChange,
	shouldKeepMounted = hasLiveEmbed,
	header,
	renderMessage,
	children,
}: MessageListProps<TMessage>) => {
	const isWaitingForMessages = isLoadingInitialMessages && messages.length === 0;
	const rows = useMemo(
		() =>
			buildMessageListRows(isWaitingForMessages ? [] : messages, {
				hasOlderMessages: hasOlderMessages && !isWaitingForMessages,
				hasNewerMessages: hasNewerMessages && !isWaitingForMessages,
				hasHeader: header !== undefined && header !== null && !isWaitingForMessages,
				firstUnreadMessageId,
				groupingPeriodSeconds,
				groupsThreadReplies,
			}),
		[
			isWaitingForMessages,
			messages,
			hasOlderMessages,
			hasNewerMessages,
			header,
			firstUnreadMessageId,
			groupingPeriodSeconds,
			groupsThreadReplies,
		],
	);

	const scroller = useMessageListScroller({
		rows,
		isLoadingNewerMessages,
		isOwnMessage: useStableCallback(isOwnMessage),
		targetMessageId,
		restoredPosition,
		onLoadOlderMessages: isLoadingOlderMessages ? undefined : onLoadOlderMessages,
		onLoadNewerMessages: isLoadingNewerMessages ? undefined : onLoadNewerMessages,
		onJumpToLatest,
		onTargetMessageReached,
		onVisibleMessagesChange,
		onPositionChange,
	});
	const { dispatch, handleRef, renderedRows, anchoredIndex, highlightedMessageId } = scroller;

	useImperativeHandle(
		ref,
		() => ({
			scrollToBottom: () => dispatch({ type: 'scrollToBottomRequested' }),
			scrollToTop: () => dispatch({ type: 'scrollToTopRequested' }),
			scrollToMessage: (messageId: string) => dispatch({ type: 'targetChanged', messageId }),
			getVisibility: scroller.getVisibility,
		}),
		[dispatch, scroller.getVisibility],
	);

	const scrollToAdjacentRow = useCallback(
		(item: HTMLElement, direction: 'up' | 'down') => {
			const index = Number(item.closest<HTMLElement>('[data-row-index]')?.dataset.rowIndex);
			if (Number.isNaN(index)) {
				return;
			}
			handleRef.current?.scrollToIndex(direction === 'up' ? index - 1 : index + 1, { align: 'nearest' });
		},
		[handleRef],
	);
	const releaseAnchor = useCallback(() => dispatch({ type: 'keyboardNavigation' }), [dispatch]);
	const navigationRef = useMessageListNavigation({ scrollToAdjacentRow, onMoveBetweenRows: releaseAnchor });
	const scrollbarsRef = useViewportScrollbars();
	const viewportRef = useMergedRefsV2(scroller.viewportRef, navigationRef, scrollbarsRef);

	const keepMounted = useMemo(() => {
		const indexes = renderedRows.flatMap((row, index) => (row.kind === 'message' && shouldKeepMounted(row.message) ? [index] : []));
		return anchoredIndex !== -1 && !indexes.includes(anchoredIndex) ? [...indexes, anchoredIndex] : indexes;
	}, [renderedRows, shouldKeepMounted, anchoredIndex]);

	const rowState = useMemo<MessageRowStateContextValue>(
		() => ({ isHighlighted: (messageId) => messageId === highlightedMessageId }),
		[highlightedMessageId],
	);

	const scrollToBottom = useCallback(() => dispatch({ type: 'scrollToBottomRequested' }), [dispatch]);
	const scrollContext = useMemo<MessageListScrollContextValue>(
		() => ({
			hasNewMessages: scroller.hasNewMessages,
			hasNewerMessages,
			isUserScrolling: scroller.isUserScrolling,
			dateBubble: scroller.dateBubble,
			scrollToBottom,
		}),
		[scroller.hasNewMessages, hasNewerMessages, scroller.isUserScrolling, scroller.dateBubble, scrollToBottom],
	);

	const isBusy = isLoadingInitialMessages || isLoadingOlderMessages || isLoadingNewerMessages;

	return (
		<Box
			position='relative'
			height='full'
			width='full'
			overflow='hidden'
			className={viewportScrollbarsHostStyle}
			data-anchor={scroller.anchor.type}
			data-phase={scroller.phase}
		>
			<Box ref={viewportRef} className={viewportStyle} role='list' aria-label={ariaLabel} aria-busy={isBusy}>
				<Box className={contentStyle}>
					{isWaitingForMessages ? (
						<Box role='presentation' display='flex' justifyContent='center' paddingBlock={24}>
							<Throbber size='x12' />
						</Box>
					) : (
						scroller.isMounted && (
							<MessageRowStateContext.Provider value={rowState}>
								<MessageListVirtualizer
									ref={handleRef}
									scrollRef={scroller.scrollRef}
									rows={renderedRows}
									shift={scroller.shift}
									cache={scroller.cache}
									keepMounted={keepMounted}
									onScroll={scroller.onScroll}
									onScrollEnd={scroller.onScrollEnd}
								>
									{(row, index) => (
										<MessageListRow
											row={row}
											index={index}
											header={header}
											isLoadingOlderMessages={isLoadingOlderMessages}
											isLoadingNewerMessages={isLoadingNewerMessages}
											renderMessage={renderMessage}
										/>
									)}
								</MessageListVirtualizer>
							</MessageRowStateContext.Provider>
						)
					)}
				</Box>
			</Box>
			<MessageListScrollContext.Provider value={scrollContext}>{children}</MessageListScrollContext.Provider>
		</Box>
	);
};

export default MessageList;
