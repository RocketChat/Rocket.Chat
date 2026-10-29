import type {
	MessageListMeasurement,
	MessageListRowsSnapshot,
	MessageListScrollCommand,
	MessageListScrollEvent,
	MessageListScrollState,
} from './messageListScrollReducer';
import { createInitialScrollState, messageListScrollReducer } from './messageListScrollReducer';

const rowsOf = (keys: string, { hasOlderMessages = false, hasNewerMessages = false } = {}): MessageListRowsSnapshot => {
	const list = keys.split('');
	return { keys: list, lastIndex: list.length - 1, hasOlderMessages, hasNewerMessages };
};

const VIEWPORT = 600;
const CONTENT = 3000;

/** A viewport `scrollTop` pixels down a 3000px conversation, with the first message 40px down. */
const at = (scrollTop: number, scrollHeight = CONTENT): MessageListMeasurement => ({
	geometry: { scrollTop, scrollHeight, clientHeight: VIEWPORT },
	messagesStart: 40,
});
const BOTTOM = at(CONTENT - VIEWPORT);
const MIDDLE = at(1200);
const TOP = at(0);

const run = (state: MessageListScrollState, events: MessageListScrollEvent[]) =>
	events.reduce<{ state: MessageListScrollState; commands: MessageListScrollCommand[] }>(
		(result, event) => {
			const next = messageListScrollReducer(result.state, event);
			return { state: next.state, commands: [...result.commands, ...next.commands] };
		},
		{ state, commands: [] },
	);

const scrolls = (state: MessageListScrollState, events: MessageListScrollEvent[]) =>
	run(state, events).commands.filter((command) => command.type === 'scrollToIndex');

const loads = (state: MessageListScrollState, events: MessageListScrollEvent[]) =>
	run(state, events).commands.filter((command) => ['loadOlder', 'loadNewer', 'jumpToLatest'].includes(command.type));

const committed = (
	rows: MessageListRowsSnapshot,
	measurement: MessageListMeasurement,
	change: Extract<MessageListScrollEvent, { type: 'dataCommitted' }>['change'] = 'none',
	tail?: 'own' | 'live' | 'page',
): MessageListScrollEvent => ({ type: 'dataCommitted', change, rows, tail, ...measurement });

const scrolled = (measurement: MessageListMeasurement): MessageListScrollEvent => ({ type: 'scroll', ...measurement });
const resized = (measurement: MessageListMeasurement): MessageListScrollEvent => ({ type: 'resize', ...measurement });
const userScroll = (measurement: MessageListMeasurement): MessageListScrollEvent[] => [
	{ type: 'userInput' },
	scrolled(measurement),
	{ type: 'scrollEnd' },
];

const idleAt = (rows: MessageListRowsSnapshot, measurement: MessageListMeasurement) =>
	run(createInitialScrollState({ rows }), [committed(rows, measurement, 'replace'), { type: 'positioningTimeout' }]).state;

const detachedAt = (rows: MessageListRowsSnapshot, measurement: MessageListMeasurement) =>
	run(idleAt(rows, BOTTOM), userScroll(measurement)).state;

describe('opening (B1)', () => {
	it('should open at the newest message', () => {
		const rows = rowsOf('abcde');
		const state = createInitialScrollState({ rows });

		expect(state).toMatchObject({ anchor: { type: 'bottom' }, phase: 'positioning' });
		expect(scrolls(state, [committed(rows, TOP, 'replace')])).toEqual([{ type: 'scrollToIndex', index: 4, align: 'end' }]);
	});

	it('should open centered on the jump target', () => {
		const rows = rowsOf('abcde');
		const state = createInitialScrollState({ rows, targetMessageId: 'c' });

		expect(state.anchor).toEqual({ type: 'message', messageId: 'c', align: 'center', offset: 0 });
		expect(scrolls(state, [committed(rows, TOP, 'replace')])).toEqual([{ type: 'scrollToIndex', index: 2, align: 'center' }]);
	});

	it('should open at the saved position', () => {
		const rows = rowsOf('abcde');
		const state = createInitialScrollState({ rows, restoreTarget: { type: 'message', messageId: 'b', offset: 30 } });

		expect(scrolls(state, [committed(rows, TOP, 'replace')])).toEqual([{ type: 'scrollToIndex', index: 1, align: 'start', offset: 30 }]);
	});

	it('should keep placing itself while rows are measured', () => {
		const rows = rowsOf('abcde');
		const state = createInitialScrollState({ rows });

		expect(scrolls(state, [committed(rows, TOP, 'replace'), resized(at(1000, 3400))])).toHaveLength(2);
	});

	it('should not page while placing itself, and check once placed', () => {
		const rows = rowsOf('abcde', { hasOlderMessages: true });
		const state = createInitialScrollState({ rows });

		expect(loads(state, [committed(rows, at(0, 400), 'replace'), scrolled(at(0, 400))])).toEqual([]);
		expect(loads(state, [committed(rows, at(0, 400), 'replace'), { type: 'positioningTimeout' }])).toEqual([{ type: 'loadOlder' }]);
	});

	it('should stop placing itself as soon as the viewer scrolls', () => {
		const rows = rowsOf('abcde');
		const { state } = run(createInitialScrollState({ rows }), [{ type: 'userInput' }]);

		expect(state.phase).toBe('idle');
	});
});

describe('staying at the bottom (B2)', () => {
	const rows = rowsOf('abcde');

	it('should follow new messages while at the bottom', () => {
		const state = idleAt(rows, BOTTOM);
		const grown = rowsOf('abcdef');

		expect(scrolls(state, [committed(grown, at(CONTENT - VIEWPORT, CONTENT + 80), 'append', 'live')])).toEqual([
			{ type: 'scrollToIndex', index: 5, align: 'end' },
		]);
	});

	it('should follow content that grows while at the bottom', () => {
		const state = idleAt(rows, BOTTOM);

		expect(scrolls(state, [resized(at(CONTENT - VIEWPORT, CONTENT + 200))])).toEqual([{ type: 'scrollToIndex', index: 4, align: 'end' }]);
	});

	it('should follow a viewport that shrinks, as when the composer grows', () => {
		const state = idleAt(rows, BOTTOM);

		expect(
			scrolls(state, [resized({ geometry: { scrollTop: 2400, scrollHeight: CONTENT, clientHeight: 500 }, messagesStart: 40 })]),
		).toHaveLength(1);
	});

	it('should not scroll again when already at the bottom', () => {
		const state = idleAt(rows, BOTTOM);

		expect(scrolls(state, [resized(BOTTOM)])).toEqual([]);
	});

	it('should not follow growth once the viewer scrolled up', () => {
		const { state } = run(idleAt(rows, BOTTOM), userScroll(MIDDLE));

		expect(state.anchor).toEqual({ type: 'none' });
		expect(scrolls(state, [resized(at(1200, CONTENT + 200))])).toEqual([]);
	});

	it('should not let a programmatic scroll release the bottom', () => {
		const { state } = run(idleAt(rows, BOTTOM), [scrolled(MIDDLE)]);

		expect(state.anchor).toEqual({ type: 'bottom' });
	});

	it('should take the bottom back when the viewer scrolls down to it', () => {
		const { state } = run(detachedAt(rows, MIDDLE), userScroll(BOTTOM));

		expect(state.anchor).toEqual({ type: 'bottom' });
	});

	it('should take the bottom back when the list reaches it without the viewer', () => {
		const { state } = run(detachedAt(rows, MIDDLE), [scrolled(BOTTOM)]);

		expect(state.anchor).toEqual({ type: 'bottom' });
	});

	it('should not take the bottom of an older page as the bottom of the conversation', () => {
		const older = rowsOf('abcde', { hasNewerMessages: true });
		const { state } = run(idleAt(older, MIDDLE), userScroll(BOTTOM));

		expect(state.anchor).toEqual({ type: 'none' });
	});
});

describe('own messages (B3)', () => {
	it('should scroll to the viewer’s own message, even when scrolled up', () => {
		const state = detachedAt(rowsOf('abcde'), MIDDLE);
		const result = run(state, [committed(rowsOf('abcdef'), MIDDLE, 'append', 'own')]);

		expect(result.state.anchor).toEqual({ type: 'bottom' });
		expect(result.commands).toContainEqual({ type: 'scrollToIndex', index: 5, align: 'end' });
	});

	it('should go back to the latest page first when detached from it, then to the bottom', () => {
		const detached = rowsOf('abcde', { hasNewerMessages: true });
		const state = idleAt(detached, MIDDLE);

		const sent = run(state, [committed(rowsOf('abcdef', { hasNewerMessages: true }), MIDDLE, 'append', 'own')]);
		expect(sent.commands).toContainEqual({ type: 'jumpToLatest' });
		expect(sent.state.isJumpingToLatest).toBe(true);

		const latest = run(sent.state, [committed(rowsOf('vwxyz'), TOP, 'replace')]);
		expect(latest.state.anchor).toEqual({ type: 'bottom' });
		expect(latest.commands).toContainEqual({ type: 'scrollToIndex', index: 4, align: 'end' });
	});
});

describe('new messages indicator (B4)', () => {
	it('should show when someone else’s message arrives while scrolled up', () => {
		const state = detachedAt(rowsOf('abcde'), MIDDLE);

		expect(run(state, [committed(rowsOf('abcdef'), MIDDLE, 'append', 'live')]).state.hasNewMessages).toBe(true);
	});

	it('should not show for a message arriving at the bottom', () => {
		const state = idleAt(rowsOf('abcde'), BOTTOM);

		expect(run(state, [committed(rowsOf('abcdef'), BOTTOM, 'append', 'live')]).state.hasNewMessages).toBe(false);
	});

	it('should not show for a page of newer messages', () => {
		const state = detachedAt(rowsOf('abcde'), MIDDLE);

		expect(run(state, [committed(rowsOf('abcdef'), MIDDLE, 'append', 'page')]).state.hasNewMessages).toBe(false);
	});

	it('should clear once the bottom is reached', () => {
		const { state } = run(detachedAt(rowsOf('abcde'), MIDDLE), [committed(rowsOf('abcdef'), MIDDLE, 'append', 'live')]);

		expect(run(state, userScroll(BOTTOM)).state.hasNewMessages).toBe(false);
	});

	it('should scroll to the bottom and clear when requested', () => {
		const { state } = run(detachedAt(rowsOf('abcde'), MIDDLE), [committed(rowsOf('abcdef'), MIDDLE, 'append', 'live')]);
		const result = run(state, [{ type: 'scrollToBottomRequested' }]);

		expect(result.state.hasNewMessages).toBe(false);
		expect(result.commands).toEqual([{ type: 'scrollToIndex', index: 5, align: 'end' }]);
	});
});

describe('older messages (B5, B21)', () => {
	const rows = rowsOf('abcde', { hasOlderMessages: true });

	it('should load older messages within a third of the viewport from the first message', () => {
		const state = detachedAt(rows, MIDDLE);

		expect(loads(state, userScroll(at(240)))).toEqual([{ type: 'loadOlder' }]);
		expect(loads(state, userScroll(at(241)))).toEqual([]);
	});

	it('should load one page at a time', () => {
		const state = detachedAt(rows, MIDDLE);

		expect(loads(state, [...userScroll(at(100)), ...userScroll(at(50))])).toEqual([{ type: 'loadOlder' }]);
	});

	it('should not load again when the loading flag flips, only after the page is committed', () => {
		const { state } = run(detachedAt(rows, MIDDLE), userScroll(at(100)));

		expect(loads(state, [{ type: 'loadSettled' }])).toEqual([]);
		expect(loads(state, [{ type: 'loadSettled' }, committed(rowsOf('xyabcde', { hasOlderMessages: true }), at(100), 'prepend')])).toEqual([
			{ type: 'loadOlder' },
		]);
	});

	it('should keep the visible messages in place when older ones are prepended', () => {
		const { state } = run(detachedAt(rows, MIDDLE), userScroll(at(100)));

		expect(scrolls(state, [{ type: 'loadSettled' }, committed(rowsOf('xyabcde'), at(900), 'prepend')])).toEqual([]);
	});

	it('should fill a viewport taller than the first page', () => {
		const state = createInitialScrollState({ rows });

		expect(loads(state, [committed(rows, at(0, 300), 'replace'), { type: 'positioningTimeout' }])).toEqual([{ type: 'loadOlder' }]);
	});

	it('should fill the viewport of a list that sits at the bottom', () => {
		const state = idleAt(rowsOf('ab', { hasOlderMessages: true }), at(0, 300));

		expect(state.loading).toBe('older');
	});
});

describe('newer messages (B6, B21)', () => {
	const rows = rowsOf('abcde', { hasNewerMessages: true });

	it('should load newer messages only at the bottom', () => {
		const state = idleAt(rows, MIDDLE);

		expect(loads(state, userScroll(at(2300)))).toEqual([]);
		expect(loads(state, userScroll(BOTTOM))).toEqual([{ type: 'loadNewer' }]);
	});

	it('should reset to the latest page when asked', () => {
		const state = idleAt(rows, MIDDLE);
		const result = run(state, [{ type: 'scrollToBottomRequested' }]);

		expect(result.commands).toEqual([{ type: 'jumpToLatest' }]);
		expect(run(result.state, [committed(rowsOf('vwxyz'), TOP, 'replace')]).state.anchor).toEqual({ type: 'bottom' });
	});
});

describe('jumping to a message (B7, B8)', () => {
	const rows = rowsOf('abcdefgh');

	it('should center a loaded message, highlight it and report it reached', () => {
		const result = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'c' }]);

		expect(result.state.anchor).toEqual({ type: 'message', messageId: 'c', align: 'center', offset: 0 });
		expect(result.commands).toEqual([
			{ type: 'scrollToIndex', index: 2, align: 'center' },
			{ type: 'highlight', messageId: 'c' },
			{ type: 'targetReached', messageId: 'c' },
		]);
	});

	it('should wait for the consumer to load an unloaded message, then jump', () => {
		const waiting = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'q' }]);

		expect(waiting.commands).toEqual([]);
		expect(waiting.state).toMatchObject({ pendingTargetId: 'q', anchor: { type: 'none' } });

		const loaded = run(waiting.state, [committed(rowsOf('opqrs', { hasOlderMessages: true, hasNewerMessages: true }), TOP, 'replace')]);
		expect(loaded.commands).toContainEqual({ type: 'scrollToIndex', index: 2, align: 'center' });
		expect(loaded.commands).toContainEqual({ type: 'targetReached', messageId: 'q' });
	});

	it('should not follow new messages to the bottom while waiting for the target', () => {
		const waiting = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'q' }]).state;

		expect(scrolls(waiting, [committed(rowsOf('abcdefghi'), BOTTOM, 'append', 'live')])).toEqual([]);
	});

	it('should keep the target centered while rows around it are measured', () => {
		const { state } = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'c' }]);

		expect(scrolls(state, [resized(at(800, 3300)), resized(at(820, 3400))])).toEqual([
			{ type: 'scrollToIndex', index: 2, align: 'center' },
			{ type: 'scrollToIndex', index: 2, align: 'center' },
		]);
	});

	it('should not page while holding the target', () => {
		const older = rowsOf('abcdefgh', { hasOlderMessages: true });
		const { state } = run(idleAt(older, BOTTOM), [{ type: 'targetChanged', messageId: 'a' }]);

		expect(loads(state, [scrolled(TOP)])).toEqual([]);
	});

	it('should release the target when the viewer scrolls', () => {
		const { state } = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'c' }, ...userScroll(MIDDLE)]);

		expect(state.anchor).toEqual({ type: 'none' });
	});

	it('should release the target once its surroundings stop resizing', () => {
		const { state } = run(idleAt(rows, BOTTOM), [
			{ type: 'targetChanged', messageId: 'c' },
			scrolled(MIDDLE),
			{ type: 'messageAnchorExpired' },
		]);

		expect(state.anchor).toEqual({ type: 'none' });
	});

	it('should follow the index of the target when rows are added before it', () => {
		const { state } = run(idleAt(rows, BOTTOM), [{ type: 'targetChanged', messageId: 'c' }]);

		expect(scrolls(state, [committed(rowsOf('xyabcdefgh'), MIDDLE, 'prepend')])).toEqual([
			{ type: 'scrollToIndex', index: 4, align: 'center' },
		]);
	});
});

describe('keyboard navigation (B17)', () => {
	it('should release the bottom, so moving between messages does not snap back', () => {
		const { state } = run(idleAt(rowsOf('abcde'), BOTTOM), [{ type: 'keyboardNavigation' }]);

		expect(state.anchor).toEqual({ type: 'none' });
		expect(scrolls(state, [resized(at(2400, CONTENT + 100))])).toEqual([]);
	});
});

describe('select all (B18)', () => {
	it('should scroll to the top and stay there', () => {
		const result = run(idleAt(rowsOf('abcde'), BOTTOM), [{ type: 'scrollToTopRequested' }]);

		expect(result.commands).toEqual([{ type: 'scrollToIndex', index: 0, align: 'start' }]);
		expect(result.state.anchor).toEqual({ type: 'none' });
	});
});

describe('other data changes', () => {
	it('should keep the topmost message in place when the middle of the list changes', () => {
		const state = detachedAt(rowsOf('abcde'), MIDDLE);

		expect(run(state, [committed(rowsOf('abxde'), MIDDLE, 'reorder')]).commands).toContainEqual({ type: 'preserveTopVisibleMessage' });
	});

	it('should go to the bottom of a window that replaced the previous one without a reason to be elsewhere', () => {
		const state = detachedAt(rowsOf('abcde'), MIDDLE);

		expect(run(state, [committed(rowsOf('vwxyz'), MIDDLE, 'replace')]).state.anchor).toEqual({ type: 'bottom' });
	});
});

describe('visibility (B16)', () => {
	it('should report what is visible after every scroll and data change', () => {
		const state = idleAt(rowsOf('abcde'), BOTTOM);

		expect(run(state, [scrolled(MIDDLE)]).commands).toContainEqual({ type: 'notifyVisibility' });
		expect(run(state, [committed(rowsOf('abcdef'), BOTTOM, 'append', 'live')]).commands).toContainEqual({ type: 'notifyVisibility' });
	});
});

describe('the user-scrolling window', () => {
	it('should be open from the first gesture until scrolling stops', () => {
		const state = idleAt(rowsOf('abcde'), BOTTOM);

		expect(run(state, [{ type: 'userInput' }]).state.userScrolling).toBe(true);
		expect(run(state, [{ type: 'userInput' }, scrolled(MIDDLE), { type: 'scrollEnd' }]).state.userScrolling).toBe(false);
	});
});
