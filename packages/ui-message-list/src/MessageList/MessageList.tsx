import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useMergedRefsV2, useViewportScrollbars, viewportScrollbarsHostStyle } from '@rocket.chat/ui-client';
import type { ReactNode, Ref } from 'react';
import { useCallback, useImperativeHandle, useMemo, useRef } from 'react';

import MessageListLoader from './MessageListLoader';
import MessageListRow from './MessageListRow';
import type { MessageListScrollContextValue } from './MessageListScrollContext';
import { MessageListScrollContext } from './MessageListScrollContext';
import MessageListVirtualizer from './MessageListVirtualizer';
import { hasLiveEmbed } from './hasLiveEmbed';
import type { MessageListMessageRow } from './lib/buildMessageListRows';
import { buildMessageListRows } from './lib/buildMessageListRows';
import type { MessageListPosition } from './lib/position';
import type { MessageListVisibility } from './scroll/useMessageListScroller';
import { useMessageListScroller } from './scroll/useMessageListScroller';
import type { MessageRowStateContextValue } from '../Message/contexts/MessageRowStateContext';
import { MessageRowStateContext } from '../Message/contexts/MessageRowStateContext';
import { useMessageListNavigation } from '../hooks/useMessageListNavigation';

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
	/** How near the end of the latest messages, in pixels, still counts as the bottom: within it the list follows what arrives. */
	'bottomThreshold'?: number;
	/**
	 * Loads no page before the viewer's first input in the list (a scroll gesture, a scroll key, a pointer press), nor after
	 * the window of the conversation is replaced, until the next input. Read when the list mounts.
	 */
	'deferPagingUntilInput'?: boolean;
	/** Space above the first row, in pixels: the list is at its top with it in view. */
	'startSpacing'?: number;
	/** Space below the last row, in pixels: the list is at its bottom, and follows what arrives, with it in view. */
	'endSpacing'?: number;
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

	&[data-waiting='true'] {
		justify-content: flex-start;
	}

	&[data-concealed='true'] {
		opacity: 0;
		pointer-events: none;
	}
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
	bottomThreshold,
	deferPagingUntilInput,
	startSpacing = 0,
	endSpacing = 0,
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
		bottomThreshold,
		deferPagingUntilInput,
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

	const rowsRef = useRef(rows);
	rowsRef.current = rows;
	const rowIndexOf = useCallback((element: HTMLElement) => {
		const index = Number(element.closest<HTMLElement>('[data-row-index]')?.dataset.rowIndex);
		return Number.isNaN(index) ? -1 : index;
	}, []);
	const scrollToAdjacentRow = useCallback(
		(item: HTMLElement, direction: 'up' | 'down') => {
			const index = rowIndexOf(item);
			const adjacent = index === -1 ? -1 : rowsRef.current.adjacentIndex(index, direction);
			if (adjacent !== -1) {
				handleRef.current?.scrollToIndex(adjacent, { align: 'nearest' });
			}
		},
		[handleRef, rowIndexOf],
	);
	const isAdjacentRow = useCallback(
		(item: HTMLElement, candidate: HTMLElement, direction: 'up' | 'down') => {
			const index = rowIndexOf(item);
			return index === -1 || rowIndexOf(candidate) === rowsRef.current.adjacentIndex(index, direction);
		},
		[rowIndexOf],
	);
	const releaseAnchor = useCallback(() => dispatch({ type: 'keyboardNavigation' }), [dispatch]);
	const navigationRef = useMessageListNavigation({ scrollToAdjacentRow, isAdjacentRow, onMoveBetweenRows: releaseAnchor });
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
			dateBubbleStore: scroller.dateBubbleStore,
			scrollToBottom,
		}),
		[scroller.hasNewMessages, hasNewerMessages, scroller.dateBubbleStore, scrollToBottom],
	);

	const isConcealed = !isWaitingForMessages && scroller.isConcealed;
	// Rows out of sight are not ready to be read either
	const isBusy = isLoadingInitialMessages || isLoadingOlderMessages || isLoadingNewerMessages || isConcealed;

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
				{/* The first page loads where the older pages do, at the top */}
				<Box className={contentStyle} data-waiting={isWaitingForMessages} data-concealed={isConcealed}>
					{isWaitingForMessages ? (
						<Box paddingBlockStart={startSpacing}>
							<MessageListLoader isLoading />
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
									startSpacing={startSpacing}
									endSpacing={endSpacing}
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
