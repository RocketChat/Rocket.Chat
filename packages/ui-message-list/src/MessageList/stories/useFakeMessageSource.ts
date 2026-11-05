import type { IMessage } from '@rocket.chat/core-typings';
import { useCallback, useMemo, useRef, useState } from 'react';

export const VIEWER = { _id: 'viewer', username: 'viewer', name: 'You' };
const AUTHORS = [{ _id: 'alice', username: 'alice', name: 'Alice' }, { _id: 'bob', username: 'bob', name: 'Bob' }, VIEWER];

const LONG_TEXT =
	'This message is long enough to wrap over several lines, so rows in the list have different heights and the virtualizer has to measure them instead of guessing. ';

export type FakeHistoryOptions = {
	size: number;
	endsAt?: Date;
	minutesApart?: number;
	/** Adds long texts, code blocks and content whose height resolves late. */
	hasMixedHeights?: boolean;
};

const textOf = (index: number, hasMixedHeights: boolean) => {
	if (hasMixedHeights && index % 7 === 3) {
		return `${index}: ${LONG_TEXT.repeat(3)}`;
	}
	if (hasMixedHeights && index % 11 === 5) {
		return `${index}: \n\`\`\`\nconst answer = ${index};\nconsole.log(answer);\n\`\`\``;
	}
	return `Message number ${index}`;
};

export const fakeMessageId = (index: number) => `message-${String(index).padStart(5, '0')}`;

/** A conversation, oldest first, spread over several days, written by a few people including the viewer. */
export const createFakeHistory = ({
	size,
	endsAt = new Date('2024-03-10T18:00:00.000Z'),
	minutesApart = 47,
	hasMixedHeights = false,
}: FakeHistoryOptions): IMessage[] =>
	Array.from({ length: size }, (_, index) => {
		const ts = new Date(endsAt.getTime() - (size - 1 - index) * minutesApart * 60_000);
		const author = AUTHORS[Math.floor(index / 3) % AUTHORS.length];
		return {
			_id: fakeMessageId(index),
			rid: 'room',
			ts,
			_updatedAt: ts,
			msg: textOf(index, hasMixedHeights),
			u: author,
			...(hasMixedHeights && index % 13 === 6 && { customFields: { lateContent: { height: 180, delay: 600 } } }),
		};
	});

export type FakeMessageSourceOptions = {
	history: IMessage[];
	pageSize?: number;
	/** Milliseconds every load takes, or `'manual'` to settle loads only when `settleLoads` is called. */
	latency?: number | 'manual';
	/** Where the first page sits: at the latest messages, or around a message. */
	initialWindow?: 'latest' | { around: string };
	isInitiallyLoading?: boolean;
	firstUnreadMessageId?: string;
};

type Window = { start: number; end: number };

const windowAround = (index: number, total: number, pageSize: number): Window => {
	const start = Math.max(0, index - Math.floor(pageSize / 2));
	return { start, end: Math.min(total, start + pageSize) };
};

const latestWindow = (total: number, pageSize: number): Window => ({ start: Math.max(0, total - pageSize), end: total });

/**
 * A simulated server for stories: a conversation of which one window is loaded, with paging, jumps and live messages,
 * behind a configurable latency.
 */
export const useFakeMessageSource = ({
	history: initialHistory,
	pageSize = 30,
	latency = 300,
	initialWindow = 'latest',
	isInitiallyLoading = false,
	firstUnreadMessageId,
}: FakeMessageSourceOptions) => {
	const [history, setHistory] = useState(initialHistory);
	const [window, setWindow] = useState<Window>(() => {
		if (initialWindow !== 'latest') {
			const index = initialHistory.findIndex((message) => message._id === initialWindow.around);
			if (index !== -1) {
				return windowAround(index, initialHistory.length, pageSize);
			}
		}
		return latestWindow(initialHistory.length, pageSize);
	});
	const [isLoadingInitialMessages, setIsLoadingInitialMessages] = useState(isInitiallyLoading);
	const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
	const [isLoadingNewerMessages, setIsLoadingNewerMessages] = useState(false);

	const historyRef = useRef(history);
	historyRef.current = history;

	const pendingLoads = useRef<(() => void)[]>([]);
	const wait = useCallback(
		() =>
			new Promise<void>((resolve) => {
				if (latency === 'manual') {
					pendingLoads.current.push(resolve);
					return;
				}
				setTimeout(resolve, latency);
			}),
		[latency],
	);

	const settleLoads = useCallback(() => {
		pendingLoads.current.splice(0).forEach((resolve) => resolve());
	}, []);

	const loadOlder = useCallback(async () => {
		setIsLoadingOlderMessages(true);
		await wait();
		setWindow(({ start, end }) => ({ start: Math.max(0, start - pageSize), end }));
		setIsLoadingOlderMessages(false);
	}, [wait, pageSize]);

	const loadNewer = useCallback(async () => {
		setIsLoadingNewerMessages(true);
		await wait();
		setWindow(({ start, end }) => ({ start, end: Math.min(historyRef.current.length, end + pageSize) }));
		setIsLoadingNewerMessages(false);
	}, [wait, pageSize]);

	const loadAround = useCallback(
		async (messageId: string) => {
			const index = historyRef.current.findIndex((message) => message._id === messageId);
			if (index === -1) {
				return;
			}
			await wait();
			setWindow(windowAround(index, historyRef.current.length, pageSize));
		},
		[wait, pageSize],
	);

	const jumpToLatest = useCallback(async () => {
		await wait();
		setWindow(latestWindow(historyRef.current.length, pageSize));
	}, [wait, pageSize]);

	const finishInitialLoad = useCallback(async () => {
		await wait();
		setIsLoadingInitialMessages(false);
	}, [wait]);

	/** Someone writes a message now: it shows when the latest page is loaded. */
	const receive = useCallback(({ fromViewer = false, lateContent }: { fromViewer?: boolean; lateContent?: boolean } = {}) => {
		const total = historyRef.current.length;
		const last = historyRef.current[total - 1];
		const ts = new Date(Math.max(Date.now(), (last?.ts.getTime() ?? 0) + 1000));
		const message: IMessage = {
			_id: fakeMessageId(total),
			rid: 'room',
			ts,
			_updatedAt: ts,
			msg: fromViewer ? `My message ${total}` : `Live message ${total}`,
			u: fromViewer ? VIEWER : AUTHORS[0],
			...(lateContent && { customFields: { lateContent: { height: 200, delay: 400 } } }),
		};

		setHistory((current) => [...current, message]);
		setWindow((current) => (current.end === total ? { start: current.start, end: total + 1 } : current));
		return message;
	}, []);

	const messages = useMemo(() => history.slice(window.start, window.end), [history, window]);

	return {
		messages,
		history,
		hasOlderMessages: window.start > 0,
		hasNewerMessages: window.end < history.length,
		isLoadingInitialMessages,
		isLoadingOlderMessages,
		isLoadingNewerMessages,
		firstUnreadMessageId,
		loadOlder,
		loadNewer,
		loadAround,
		jumpToLatest,
		finishInitialLoad,
		receive,
		settleLoads,
	};
};
