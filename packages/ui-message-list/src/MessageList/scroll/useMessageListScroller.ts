import type { IMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CacheSnapshot, VirtualizerHandle } from 'virtua';

import {
	DATE_BUBBLE_ZONE_PX,
	HIGHLIGHT_DURATION_MS,
	MESSAGE_ANCHOR_RELEASE_MS,
	POSITION_REPORT_DEBOUNCE_MS,
	POSITIONING_STABLE_FRAMES,
	POSITIONING_TIMEOUT_MS,
	SCROLL_KEYS,
	USER_INPUT_WITHOUT_SCROLL_MS,
} from './constants';
import type {
	MessageListAnchor,
	MessageListMeasurement,
	MessageListRowsSnapshot,
	MessageListScrollCommand,
	MessageListScrollEvent,
	MessageListScrollState,
	MessageListTailChange,
} from './messageListScrollReducer';
import { createInitialScrollState, messageListScrollReducer } from './messageListScrollReducer';
import { planRowsCommit } from './planRowsCommit';
import type { MessageListRow, MessageListRows } from '../lib/buildMessageListRows';
import type { MessageListPosition } from '../lib/position';
import { describeCacheKeys, getReusableCache, resolveRestoreTarget } from '../lib/position';

export type MessageListVisibility<TMessage extends IMessage = IMessage> = {
	topMessage: TMessage | undefined;
	isFirstUnreadVisible: boolean;
	isAtBottom: boolean;
};

export type MessageListDateBubble = {
	date: Date;
	/** An inline day divider, or the start of the conversation, already shows at the top. */
	isCovered: boolean;
};

export type UseMessageListScrollerOptions<TMessage extends IMessage> = {
	rows: MessageListRows<TMessage>;
	isLoadingNewerMessages: boolean;
	isOwnMessage: (message: TMessage) => boolean;
	targetMessageId: string | undefined;
	restoredPosition: MessageListPosition | undefined;
	onLoadOlderMessages: (() => Promise<unknown> | void) | undefined;
	onLoadNewerMessages: (() => Promise<unknown> | void) | undefined;
	onJumpToLatest: (() => Promise<unknown> | void) | undefined;
	onTargetMessageReached: ((messageId: string) => void) | undefined;
	onVisibleMessagesChange: ((visibility: MessageListVisibility<TMessage>) => void) | undefined;
	onPositionChange: ((position: MessageListPosition) => void) | undefined;
};

const isEditable = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

const snapshotOf = (rows: readonly MessageListRow[], { hasOlder, hasNewer }: { hasOlder: boolean; hasNewer: boolean }) => {
	const keys = rows.map((row) => row.key);
	return { keys, lastIndex: keys.length - 1, hasOlderMessages: hasOlder, hasNewerMessages: hasNewer } satisfies MessageListRowsSnapshot;
};

const sameVisibility = (a: MessageListVisibility | undefined, b: MessageListVisibility) =>
	!!a && a.topMessage?._id === b.topMessage?._id && a.isFirstUnreadVisible === b.isFirstUnreadVisible && a.isAtBottom === b.isAtBottom;

/**
 * Drives a virtualized message list from {@link messageListScrollReducer}: it feeds the reducer what the viewer and the data
 * do, and carries out what the reducer decides on the virtualizer.
 */
export const useMessageListScroller = <TMessage extends IMessage>({
	rows,
	isLoadingNewerMessages,
	isOwnMessage,
	targetMessageId,
	restoredPosition,
	onLoadOlderMessages,
	onLoadNewerMessages,
	onJumpToLatest,
	onTargetMessageReached,
	onVisibleMessagesChange,
	onPositionChange,
}: UseMessageListScrollerOptions<TMessage>) => {
	const handleRef = useRef<VirtualizerHandle>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const [viewportWidth, setViewportWidth] = useState<number>();

	const initialCacheRef = useRef<{ value: CacheSnapshot | undefined }>(undefined);

	const stateRef = useRef<MessageListScrollState>(undefined);
	stateRef.current ??= createInitialScrollState({
		rows: snapshotOf([], { hasOlder: false, hasNewer: false }),
		targetMessageId,
		restoreTarget: resolveRestoreTarget(restoredPosition, (messageId) => rows.indexOfMessage(messageId) !== -1),
	});

	const [view, setView] = useState(() => ({
		anchor: stateRef.current?.anchor as MessageListAnchor,
		phase: stateRef.current?.phase,
		hasNewMessages: false,
		userScrolling: false,
	}));
	const [highlightedMessageId, setHighlightedMessageId] = useState<string>();
	const [dateBubble, setDateBubble] = useState<MessageListDateBubble>();

	// Rows reach the virtualizer only once its viewport exists, and in two steps when they change at both ends
	const renderedKeysRef = useRef<readonly string[]>([]);
	const [stage, setStage] = useState(0);
	const isMounted = viewportWidth !== undefined;
	const plan = useMemo(
		() => (isMounted ? planRowsCommit(renderedKeysRef.current, rows.keys) : undefined),
		// The rendered keys only change along with `stage` or the rows
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[isMounted, rows.keys, stage],
	);
	const renderedRows = useMemo(() => (plan ? rows.rows.slice(0, plan.renderedLength) : []), [plan, rows.rows]);
	const isStaged = !!plan && plan.renderedLength < rows.rows.length;

	if (isMounted && !initialCacheRef.current) {
		initialCacheRef.current = { value: getReusableCache(restoredPosition, rows.keys, viewportWidth) };
	}

	const rowsRef = useRef(rows);
	rowsRef.current = rows;
	const renderedRowsRef = useRef(renderedRows);
	renderedRowsRef.current = renderedRows;

	const measure = useCallback((): MessageListMeasurement | undefined => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return undefined;
		}

		const handle = handleRef.current;
		const { firstMessageIndex } = rowsRef.current;
		const messagesStart =
			handle && firstMessageIndex > 0 && firstMessageIndex < renderedRowsRef.current.length ? handle.getItemOffset(firstMessageIndex) : 0;

		return {
			geometry: { scrollTop: viewport.scrollTop, scrollHeight: viewport.scrollHeight, clientHeight: viewport.clientHeight },
			messagesStart,
		};
	}, []);

	const visibilityRef = useRef<MessageListVisibility<TMessage>>(undefined);
	const positionRef = useRef<MessageListPosition>(undefined);
	const topVisibleRef = useRef<{ messageId: string; offset: number }>(undefined);
	const reportPositionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const reportPosition = useStableCallback(() => {
		clearTimeout(reportPositionTimer.current);
		reportPositionTimer.current = undefined;
		if (positionRef.current) {
			onPositionChange?.(positionRef.current);
		}
	});

	const notifyVisibility = useStableCallback(() => {
		const handle = handleRef.current;
		const viewport = viewportRef.current;
		const currentRows = renderedRowsRef.current;
		if (!handle || !viewport || currentRows.length === 0) {
			return;
		}

		const { scrollOffset, viewportSize } = handle;
		const start = handle.findItemIndex(scrollOffset);
		const end = handle.findItemIndex(scrollOffset + viewportSize - 1);

		const topIndex = currentRows.findIndex((row, index) => index >= start && row.kind === 'message');
		const topRow = currentRows[topIndex];
		const topMessage = topRow?.kind === 'message' ? topRow.message : undefined;
		const { firstUnreadIndex } = rowsRef.current;
		const isAtBottom = stateRef.current?.anchor.type === 'bottom';

		const visibility: MessageListVisibility<TMessage> = {
			topMessage,
			isFirstUnreadVisible: firstUnreadIndex !== -1 && firstUnreadIndex >= start && firstUnreadIndex <= end,
			isAtBottom,
		};
		if (!sameVisibility(visibilityRef.current, visibility)) {
			visibilityRef.current = visibility;
			onVisibleMessagesChange?.(visibility);
		}

		if (topMessage) {
			const offset = scrollOffset - handle.getItemOffset(topIndex);
			topVisibleRef.current = { messageId: topMessage._id, offset };
			positionRef.current = {
				isAtBottom,
				anchorMessageId: topMessage._id,
				offsetWithinAnchor: offset,
				cache: handle.cache,
				cacheKeys: describeCacheKeys(currentRows.map((row) => row.key)),
				width: viewport.clientWidth,
			};
			if (onPositionChange && !reportPositionTimer.current) {
				reportPositionTimer.current = setTimeout(reportPosition, POSITION_REPORT_DEBOUNCE_MS);
			}
		}

		const bubbleIndex = handle.findItemIndex(scrollOffset + DATE_BUBBLE_ZONE_PX);
		const bubbleRow = currentRows[bubbleIndex];
		if (bubbleRow?.kind === 'message') {
			const rowTop = handle.getItemOffset(bubbleIndex);
			const isCovered = currentRows[0]?.kind === 'header' && start === 0 ? true : bubbleRow.startsNewDay && rowTop >= scrollOffset;
			setDateBubble((previous) =>
				previous?.date.getTime() === bubbleRow.message.ts.getTime() && previous.isCovered === isCovered
					? previous
					: { date: bubbleRow.message.ts, isCovered },
			);
		} else {
			setDateBubble((previous) => (previous?.isCovered ? previous : previous && { ...previous, isCovered: true }));
		}
	});

	// Re-applying an anchor more than once per frame only fights the virtualizer's own corrections
	const scrollFrame = useRef<number>(undefined);
	const queuedScroll = useRef<Extract<MessageListScrollCommand, { type: 'scrollToIndex' }>>(undefined);
	const scrollToIndex = useCallback((command: Extract<MessageListScrollCommand, { type: 'scrollToIndex' }>) => {
		if (scrollFrame.current !== undefined) {
			queuedScroll.current = command;
			return;
		}

		handleRef.current?.scrollToIndex(command.index, { align: command.align, offset: command.offset });

		const flush = () => {
			scrollFrame.current = undefined;
			const queued = queuedScroll.current;
			if (!queued) {
				return;
			}
			queuedScroll.current = undefined;
			handleRef.current?.scrollToIndex(queued.index, { align: queued.align, offset: queued.offset });
			scrollFrame.current = requestAnimationFrame(flush);
		};
		scrollFrame.current = requestAnimationFrame(flush);
	}, []);

	const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const dispatchRef = useRef<(event: MessageListScrollEvent) => void>(() => undefined);

	// A page of newer messages can be committed before or after its load settles; until then, rows added at the end are that page
	const awaitingNewerPageRef = useRef(false);

	const load = (loader: (() => Promise<unknown> | void) | undefined) => {
		void Promise.resolve()
			.then(() => loader?.())
			.catch(() => undefined)
			.finally(() => dispatchRef.current({ type: 'loadSettled' }));
	};

	const execute = useStableCallback((command: MessageListScrollCommand) => {
		switch (command.type) {
			case 'scrollToIndex':
				scrollToIndex(command);
				break;

			case 'preserveTopVisibleMessage': {
				const topVisible = topVisibleRef.current;
				const index = topVisible ? renderedRowsRef.current.findIndex((row) => row.key === topVisible.messageId) : -1;
				if (topVisible && index !== -1) {
					scrollToIndex({ type: 'scrollToIndex', index, align: 'start', offset: topVisible.offset });
				}
				break;
			}

			case 'loadOlder':
				load(onLoadOlderMessages);
				break;

			case 'loadNewer':
				awaitingNewerPageRef.current = true;
				load(onLoadNewerMessages);
				break;

			case 'jumpToLatest':
				void Promise.resolve(onJumpToLatest?.()).catch(() => undefined);
				break;

			case 'highlight':
				clearTimeout(highlightTimer.current);
				setHighlightedMessageId(command.messageId);
				highlightTimer.current = setTimeout(() => setHighlightedMessageId(undefined), HIGHLIGHT_DURATION_MS);
				break;

			case 'targetReached':
				onTargetMessageReached?.(command.messageId);
				break;

			case 'notifyVisibility':
				notifyVisibility();
				break;
		}
	});

	const dispatch = useStableCallback((event: MessageListScrollEvent) => {
		const { current } = stateRef;
		if (!current) {
			return;
		}

		const { state, commands } = messageListScrollReducer(current, event);
		stateRef.current = state;
		setView((previous) =>
			previous.anchor === state.anchor &&
			previous.phase === state.phase &&
			previous.hasNewMessages === state.hasNewMessages &&
			previous.userScrolling === state.userScrolling
				? previous
				: { anchor: state.anchor, phase: state.phase, hasNewMessages: state.hasNewMessages, userScrolling: state.userScrolling },
		);
		commands.forEach(execute);
	});
	dispatchRef.current = dispatch;

	const tailOf = (change: string): MessageListTailChange | undefined => {
		if (change !== 'append') {
			return undefined;
		}
		const last = renderedRows.findLast((row) => row.kind === 'message');
		if (last?.kind !== 'message' || renderedKeysRef.current.includes(last.key)) {
			return undefined;
		}
		if (isOwnMessage(last.message)) {
			return 'own';
		}
		if (awaitingNewerPageRef.current) {
			awaitingNewerPageRef.current = false;
			return 'page';
		}
		return isLoadingNewerMessages ? 'page' : 'live';
	};

	// Strict mode runs this effect twice for one commit; each plan is carried out once
	const carriedOutPlanRef = useRef<typeof plan>(undefined);
	useLayoutEffect(() => {
		if (!plan || carriedOutPlanRef.current === plan) {
			return;
		}
		carriedOutPlanRef.current = plan;

		if (plan.change === 'none') {
			renderedKeysRef.current = renderedRows.map((row) => row.key);
			return;
		}

		const tail = tailOf(plan.change);
		renderedKeysRef.current = renderedRows.map((row) => row.key);
		const measurement = measure();
		if (measurement) {
			dispatch({
				type: 'dataCommitted',
				change: plan.change,
				tail,
				rows: snapshotOf(renderedRows, {
					hasOlder: rows.rows[0]?.kind === 'olderLoader',
					hasNewer: rows.rows.at(-1)?.kind === 'newerLoader',
				}),
				...measurement,
			});
		}

		if (isStaged) {
			setStage((stage) => stage + 1);
		}
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [plan]);

	const previousTargetRef = useRef(targetMessageId);
	useLayoutEffect(() => {
		if (previousTargetRef.current === targetMessageId) {
			return;
		}
		previousTargetRef.current = targetMessageId;
		dispatch({ type: 'targetChanged', messageId: targetMessageId });
	}, [targetMessageId, dispatch]);

	// The list counts as placed once nothing has moved for a few frames, or after a timeout while content keeps resizing
	useLayoutEffect(() => {
		if (view.phase !== 'positioning' || !isMounted) {
			return;
		}

		let frame = 0;
		let stableFrames = 0;
		let last = '';
		const check = () => {
			const viewport = viewportRef.current;
			const current = viewport ? `${viewport.scrollTop}:${viewport.scrollHeight}:${viewport.clientHeight}` : '';
			stableFrames = current === last ? stableFrames + 1 : 0;
			last = current;
			if (stableFrames >= POSITIONING_STABLE_FRAMES) {
				dispatch({ type: 'positioningTimeout' });
				return;
			}
			frame = requestAnimationFrame(check);
		};
		frame = requestAnimationFrame(check);
		const timeout = setTimeout(() => dispatch({ type: 'positioningTimeout' }), POSITIONING_TIMEOUT_MS);

		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timeout);
		};
	}, [view.phase, isMounted, dispatch]);

	const messageAnchorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const armMessageAnchorRelease = useStableCallback(() => {
		clearTimeout(messageAnchorTimer.current);
		if (stateRef.current?.anchor.type === 'message') {
			messageAnchorTimer.current = setTimeout(() => dispatch({ type: 'messageAnchorExpired' }), MESSAGE_ANCHOR_RELEASE_MS);
		}
	});
	useLayoutEffect(() => {
		armMessageAnchorRelease();
	}, [view.anchor, armMessageAnchorRelease]);

	const scrollEndTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const onScroll = useStableCallback(() => {
		clearTimeout(scrollEndTimer.current);
		const measurement = measure();
		if (measurement) {
			dispatch({ type: 'scroll', ...measurement });
		}
	});

	const onScrollEnd = useStableCallback(() => {
		dispatch({ type: 'scrollEnd' });
	});

	const onUserInput = useStableCallback(() => {
		dispatch({ type: 'userInput' });
		clearTimeout(scrollEndTimer.current);
		scrollEndTimer.current = setTimeout(onScrollEnd, USER_INPUT_WITHOUT_SCROLL_MS);
	});

	const onResize = useStableCallback(() => {
		const measurement = measure();
		if (measurement) {
			dispatch({ type: 'resize', ...measurement });
		}
		armMessageAnchorRelease();
	});

	const viewportCallbackRef: RefCallback<HTMLDivElement> = useCallback(
		(viewport: HTMLDivElement) => {
			viewportRef.current = viewport;
			setViewportWidth(viewport.clientWidth);

			const onKeyDown = (event: KeyboardEvent) => {
				if (SCROLL_KEYS.includes(event.key) && !isEditable(event.target)) {
					onUserInput();
				}
			};
			// The overlay scrollbars are drawn next to the viewport, not inside it
			const scrollbarsHost = viewport.parentElement;
			const onScrollbarPointerDown = (event: Event) => {
				if (event.target instanceof Element && event.target.closest('.os-scrollbar')) {
					onUserInput();
				}
			};

			const resizeObserver = new ResizeObserver(() => onResize());
			resizeObserver.observe(viewport);
			if (viewport.firstElementChild) {
				resizeObserver.observe(viewport.firstElementChild);
			}

			viewport.addEventListener('wheel', onUserInput, { passive: true });
			viewport.addEventListener('touchstart', onUserInput, { passive: true });
			viewport.addEventListener('touchmove', onUserInput, { passive: true });
			viewport.addEventListener('keydown', onKeyDown);
			viewport.addEventListener('scrollend', onScrollEnd);
			scrollbarsHost?.addEventListener('pointerdown', onScrollbarPointerDown);

			return () => {
				reportPosition();
				resizeObserver.disconnect();
				viewport.removeEventListener('wheel', onUserInput);
				viewport.removeEventListener('touchstart', onUserInput);
				viewport.removeEventListener('touchmove', onUserInput);
				viewport.removeEventListener('keydown', onKeyDown);
				viewport.removeEventListener('scrollend', onScrollEnd);
				scrollbarsHost?.removeEventListener('pointerdown', onScrollbarPointerDown);
				viewportRef.current = null;
				if (scrollFrame.current !== undefined) {
					cancelAnimationFrame(scrollFrame.current);
				}
				clearTimeout(scrollEndTimer.current);
				clearTimeout(messageAnchorTimer.current);
				clearTimeout(highlightTimer.current);
			};
		},
		[onUserInput, onScrollEnd, onResize, reportPosition],
	);

	const anchoredIndex = view.anchor.type === 'message' ? rows.indexOfMessage(view.anchor.messageId) : -1;

	return {
		handleRef,
		viewportRef: viewportCallbackRef,
		/** The virtualizer reads its scroll element once, from an object ref. */
		scrollRef: viewportRef,
		isMounted,
		renderedRows,
		shift: plan?.shift ?? false,
		cache: initialCacheRef.current?.value,
		anchoredIndex,
		anchor: view.anchor,
		phase: view.phase,
		hasNewMessages: view.hasNewMessages,
		isUserScrolling: view.userScrolling,
		highlightedMessageId,
		dateBubble,
		onScroll,
		onScrollEnd,
		dispatch,
		getVisibility: useCallback(() => visibilityRef.current, []),
	};
};
