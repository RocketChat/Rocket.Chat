import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useDebouncedCallback, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { MessageTypes } from '@rocket.chat/message-types';
import { isTruthy } from '@rocket.chat/tools';
import { clientCallbacks, CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import { useSearchParameter, useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { differenceInSeconds } from 'date-fns';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { VirtualizerHandle } from 'virtua';
import { VList } from 'virtua';

import { ThreadMessageItem } from './ThreadMessageItem';
import InfiniteListAnchor from '../../../../../components/InfiniteListAnchor';
import { useMergedRefsV2 } from '../../../../../hooks/useMergedRefsV2';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
import { BubbleDate } from '../../../BubbleDate';
import { useKeepAtBottom } from '../../../MessageList/hooks/useKeepAtBottom';
import { useKeepMountedMessages } from '../../../MessageList/hooks/useKeepMountedMessages';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import { clearHighlightMessage, setHighlightMessage } from '../../../MessageList/providers/messageHighlightSubscription';
import LoadingMessagesIndicator from '../../../body/LoadingMessagesIndicator';
import { useRoom } from '../../../contexts/RoomContext';
import { useDateScroll } from '../../../hooks/useDateScroll';
import { useFirstUnreadMessageId } from '../../../hooks/useFirstUnreadMessageId';
import { useMessageListNavigation } from '../../../hooks/useMessageListNavigation';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';
import './threads.css';

const isMessageSequential = (current: IMessage, previous: IMessage | undefined, groupingRange: number): boolean => {
	if (!previous) {
		return false;
	}

	if (MessageTypes.isSystemMessage(current) || MessageTypes.isSystemMessage(previous)) {
		return false;
	}

	if (current.groupable === false) {
		return false;
	}

	if (current.u._id !== previous.u._id) {
		return false;
	}

	if (current.alias !== previous.alias) {
		return false;
	}
	return differenceInSeconds(current.ts, previous.ts) < groupingRange && !isMessageNewDay(current, previous);
};

export type ThreadMessageListProps = {
	mainMessage: IThreadMainMessage;
	shouldJumpToBottom: boolean;
	setShouldJumpToBottom: (shouldJumpToBottom: boolean) => void;
};

const ThreadMessageList = ({ mainMessage, shouldJumpToBottom, setShouldJumpToBottom }: ThreadMessageListProps) => {
	const { t } = useTranslation();
	const msgJumpParam = useSearchParameter('msg');
	const { bubbleRef, handleDateScroll, ...bubbleDate } = useDateScroll();

	const {
		data,
		isLoading: loading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		fetchPreviousPage,
		hasPreviousPage,
		isFetchingPreviousPage,
		loadMessageAround,
		jumpToRecent,
	} = useThreadMessagesQuery(mainMessage._id);
	const messages = useMemo(() => data?.messages ?? [], [data?.messages]);

	const userInteractedRef = useRef(false);
	const isJumpingToMessageRef = useRef(false);
	const isPrependRef = useRef(false);

	const loadMoreMessages = useDebouncedCallback(
		() => {
			if (userInteractedRef.current && !isJumpingToMessageRef.current && hasNextPage && !isFetchingNextPage) {
				void fetchNextPage();
			}
		},
		100,
		[hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	const initialScrollDoneRef = useRef(false);

	const loadPreviousMessages = useDebouncedCallback(
		() => {
			if (
				userInteractedRef.current &&
				!isJumpingToMessageRef.current &&
				initialScrollDoneRef.current &&
				isAtBottom.current !== true &&
				hasPreviousPage &&
				!isFetchingPreviousPage
			) {
				isPrependRef.current = true;
				void fetchPreviousPage();
			}
		},
		100,
		[hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage],
	);

	const room = useRoom();
	const uid = useUserId();

	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const { messageListRef } = useMessageListNavigation();

	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const isAtBottom = useRef<boolean | null>(null);
	const prevItemsLengthRef = useRef(0);

	const { keepAtBottomRef, setKeepAtBottom } = useKeepAtBottom(isAtBottom);
	const messagesLength = messages.length;
	useEffect(() => {
		setKeepAtBottom(() => {
			if (virtualizerRef.current && !msgJumpParam && !isJumpingToMessageRef.current) {
				virtualizerRef.current.scrollToIndex(messagesLength + 1, {
					align: 'end',
				});
			}
		});
	}, [messagesLength, setKeepAtBottom, msgJumpParam]);
	const loadingWindowKeyRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (loading || !msgJumpParam || isFetchingNextPage || isFetchingPreviousPage) {
			return;
		}
		if (msgJumpParam === mainMessage._id && !hasPreviousPage) {
			return;
		}
		if (messages.some((message) => message._id === msgJumpParam)) {
			return;
		}
		const windowKey = `${mainMessage._id}:${msgJumpParam}`;
		if (loadingWindowKeyRef.current === windowKey) {
			return;
		}
		loadingWindowKeyRef.current = windowKey;
		loadMessageAround(msgJumpParam).catch(() => {
			if (loadingWindowKeyRef.current === windowKey) {
				loadingWindowKeyRef.current = undefined;
			}
			isJumpingToMessageRef.current = false;
		});
	}, [loading, isFetchingNextPage, isFetchingPreviousPage, msgJumpParam, messages, mainMessage._id, loadMessageAround, hasPreviousPage]);

	const interactionRef = useSafeRefCallback(
		useCallback((element: HTMLDivElement) => {
			const markInteracted = () => {
				userInteractedRef.current = true;
			};
			const handleKeydown = (e: KeyboardEvent) => {
				if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
					userInteractedRef.current = true;
				}
			};
			const parent = element.parentElement;

			parent?.addEventListener('pointerdown', markInteracted);
			element.addEventListener('wheel', markInteracted, { passive: true });
			element.addEventListener('keydown', handleKeydown);
			return () => {
				parent?.removeEventListener('pointerdown', markInteracted);
				element.removeEventListener('wheel', markInteracted);
				element.removeEventListener('keydown', handleKeydown);
			};
		}, []),
	);

	const mergedRefs = useMergedRefsV2(messageListRef, keepAtBottomRef, interactionRef);

	const lastScrollSizeRef = useRef(0);

	const showMainMessage = !hasPreviousPage;
	const items = useMemo(() => {
		if (loading) {
			return [];
		}
		return showMainMessage ? [mainMessage, ...messages] : messages;
	}, [loading, showMainMessage, mainMessage, messages]);

	const prevItemsCountRef = useRef(0);
	useLayoutEffect(() => {
		if (isPrependRef.current && items.length !== prevItemsCountRef.current) {
			isPrependRef.current = false;
		}
		prevItemsCountRef.current = items.length;
		if (hasNextPage) {
			isAtBottom.current = false;
		}
	});

	const threadMsgTargetIndex = useMemo(() => {
		if (!msgJumpParam || loading) {
			return -1;
		}
		if (msgJumpParam === mainMessage._id) {
			return showMainMessage ? 0 : -1;
		}
		const replyIndex = messages.findIndex((m) => m._id === msgJumpParam);
		if (replyIndex < 0) {
			return -1;
		}
		const mainMessageOffset = showMainMessage ? 1 : 0;
		const previousPageLoaderOffset = hasPreviousPage ? 1 : 0;
		return mainMessageOffset + previousPageLoaderOffset + replyIndex;
	}, [msgJumpParam, loading, mainMessage._id, messages, showMainMessage, hasPreviousPage]);

	const lastThreadJumpKeyRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		lastThreadJumpKeyRef.current = undefined;
		loadingWindowKeyRef.current = undefined;
		prevItemsLengthRef.current = 0;
		initialScrollDoneRef.current = false;
		userInteractedRef.current = false;
		isJumpingToMessageRef.current = false;
		isPrependRef.current = false;
	}, [mainMessage._id]);

	useEffect(() => {
		if (!msgJumpParam) {
			isJumpingToMessageRef.current = false;
			return;
		}
		isJumpingToMessageRef.current = true;
		isAtBottom.current = false;
	}, [msgJumpParam]);

	useEffect(() => {
		const handle = virtualizerRef.current;
		if (!handle) return;
		if (loading) return;
		// `msg` deep link: jump effect runs below; do not force scroll to bottom
		if (msgJumpParam) {
			setShouldJumpToBottom(false);
			return;
		}

		// Scroll to bottom when current user's optimistic (temp) message is appended.
		// Fires before server confirmation, giving immediate scroll feedback.
		const prev = prevItemsLengthRef.current;
		prevItemsLengthRef.current = items.length;
		if (items.length > prev && uid) {
			const lastItem = items.at(-1);
			if (lastItem?.temp && lastItem.u._id === uid && !hasNextPage) {
				setShouldJumpToBottom(true);
			}
		}

		if (isAtBottom.current === true && !isFetchingPreviousPage && !isFetchingNextPage && lastScrollSizeRef.current !== handle?.scrollSize) {
			lastScrollSizeRef.current = handle?.scrollSize ?? 0;
			setShouldJumpToBottom(true);
		}
		if (shouldJumpToBottom) {
			// Optimistically mark as at-bottom before the scroll executes (rAF).
			// This ensures the ResizeObserver in useKeepAtBottom re-scrolls if
			// quote/attachment content grows between now and when Virtua fires the scroll.
			isAtBottom.current = true;
			handle.scrollToIndex(items.length, { align: 'end' });
			setShouldJumpToBottom(false);
			initialScrollDoneRef.current = true;
		}
	}, [
		items,
		loading,
		msgJumpParam,
		threadMsgTargetIndex,
		shouldJumpToBottom,
		setShouldJumpToBottom,
		uid,
		isFetchingPreviousPage,
		isFetchingNextPage,
		hasNextPage,
	]);

	useEffect(() => {
		if (threadMsgTargetIndex < 0 || !msgJumpParam) {
			return;
		}
		const jumpKey = `${mainMessage._id}:${msgJumpParam}`;
		if (lastThreadJumpKeyRef.current === jumpKey) {
			return;
		}
		const handle = virtualizerRef.current;
		if (!handle) {
			return;
		}
		lastThreadJumpKeyRef.current = jumpKey;
		setShouldJumpToBottom(false);
		initialScrollDoneRef.current = true;

		let frame = 0;
		let rafId = 0;
		const recenter = () => {
			handle.scrollToIndex(threadMsgTargetIndex, { align: 'center' });
			frame += 1;
			if (frame < 8) {
				rafId = requestAnimationFrame(recenter);
			}
		};
		recenter();

		setHighlightMessage(msgJumpParam);
		const highlightTimeout = setTimeout(() => {
			clearHighlightMessage();
		}, 2000);
		const settleTimeout = setTimeout(() => {
			isJumpingToMessageRef.current = false;
		}, 500);

		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(highlightTimeout);
			clearTimeout(settleTimeout);
		};
	}, [threadMsgTargetIndex, msgJumpParam, mainMessage._id, setShouldJumpToBottom]);

	useEffect(() => {
		if (!msgJumpParam) {
			return;
		}
		const clearMsgJumpParam = () => {
			if (messages.find((m) => m._id === msgJumpParam) && mainMessage._id !== msgJumpParam) {
				setMessageJumpQueryStringParameter(null);
			}
		};
		setTimeout(() => {
			clearMsgJumpParam();
		}, 500);
	}, [msgJumpParam, messages, mainMessage._id]);

	useEffect(() => {
		const handlerId = `thread-scroll-${mainMessage._id}`;
		clientCallbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (msg.rid !== room._id || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}
				if (msg.u._id === uid) {
					if (hasNextPage) {
						void jumpToRecent().then(() => setShouldJumpToBottom(true));
						return;
					}
					setShouldJumpToBottom(true);
				}
			},
			clientCallbacks.priority.MEDIUM,
			handlerId,
		);

		return () => {
			clientCallbacks.remove('streamNewMessage', handlerId);
		};
	}, [room._id, uid, mainMessage._id, setShouldJumpToBottom, hasNextPage, jumpToRecent]);

	const keepMountedMessages = useKeepMountedMessages(items);

	return (
		<div className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}>
			<BubbleDate ref={bubbleRef} {...bubbleDate} />
			<CustomVirtuaScrollbars ref={mergedRefs}>
				<MessageListProvider>
					<VList
						ref={virtualizerRef}
						shift={isPrependRef.current}
						style={{ height: '100%' }}
						aria-label={t('Thread_message_list')}
						aria-busy={loading || isFetchingNextPage || isFetchingPreviousPage}
						role='list'
						keepMounted={keepMountedMessages}
						onScroll={(offset) => {
							const handle = virtualizerRef.current;
							if (!handle) return;

							if (offset < 200 && hasPreviousPage && !isJumpingToMessageRef.current) {
								loadPreviousMessages();
							}

							// Copied from messageList, I'm unsure why this is necessary, but it seems to be needed to properly set the isAtBottom state
							if (hasNextPage) {
								isAtBottom.current = false;
							} else {
								if (handle.scrollSize >= handle.viewportSize) {
									isAtBottom.current = true;
								}
								isAtBottom.current = offset - handle.scrollSize + handle.viewportSize >= -20;
							}

							if (hasNextPage && !isJumpingToMessageRef.current && offset - handle.scrollSize + handle.viewportSize >= -200) {
								loadMoreMessages();
							}

							const topMessage = items[handle.findItemIndex(handle.scrollOffset)];
							handleDateScroll(topMessage, offset);
						}}
					>
						{loading ? (
							<div className='load-more' role='presentation'>
								<LoadingMessagesIndicator />
							</div>
						) : null}
						{!loading && hasPreviousPage ? (
							<div className='load-more' role='presentation'>
								{isFetchingPreviousPage ? <LoadingMessagesIndicator /> : null}
							</div>
						) : null}
						{!loading &&
							items.map((message, index, { [index - 1]: previous }) => {
								const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
								const newDay = isMessageNewDay(message, previous);
								const shouldShowAsSequential = sequential && !newDay;
								const firstUnread = firstUnreadMessageId === message._id;
								const system = MessageTypes.isSystemMessage(message);

								return (
									<Fragment key={message._id}>
										<ThreadMessageItem
											message={message}
											previous={previous}
											sequential={sequential}
											shouldShowAsSequential={shouldShowAsSequential}
											showUserAvatar={showUserAvatar}
											firstUnread={firstUnread}
											system={system}
										/>
									</Fragment>
								);
							})}
						{!loading && hasNextPage ? (
							<div className='load-more' role='presentation'>
								{isFetchingNextPage ? <LoadingMessagesIndicator /> : <InfiniteListAnchor loadMore={loadMoreMessages} />}
							</div>
						) : null}
					</VList>
				</MessageListProvider>
			</CustomVirtuaScrollbars>
		</div>
	);
};

export default ThreadMessageList;
