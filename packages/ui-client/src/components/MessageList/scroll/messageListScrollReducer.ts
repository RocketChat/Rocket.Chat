import type { MessageKeysChange } from '../lib/diffMessageKeys';
import type { ScrollGeometry } from '../lib/geometry';
import { isAtBottom, isNearNewerEdge, isNearOlderEdge } from '../lib/geometry';
import type { RestoreTarget } from '../lib/position';

export type MessageListAnchor =
	{ type: 'bottom' } | { type: 'message'; messageId: string; align: 'start' | 'center'; offset: number } | { type: 'none' };

export type MessageListPhase = 'positioning' | 'idle';

export type MessageListRowsSnapshot = {
	keys: readonly string[];
	lastIndex: number;
	hasOlderMessages: boolean;
	hasNewerMessages: boolean;
};

export type MessageListMeasurement = {
	geometry: ScrollGeometry;
	/** Offset of the first message row: what is above it is the older loader or the header. */
	messagesStart: number;
};

export type MessageListScrollState = {
	anchor: MessageListAnchor;
	phase: MessageListPhase;
	/** Open from the viewer's first scroll gesture until scrolling stops: only scrolls inside it are the viewer's. */
	userScrolling: boolean;
	rows: MessageListRowsSnapshot;
	measurement: MessageListMeasurement | undefined;
	loading: 'older' | 'newer' | undefined;
	/** Someone else's message arrived while the viewer was away from the bottom. */
	hasNewMessages: boolean;
	/** A message to jump to once the consumer has loaded it. */
	pendingTargetId: string | undefined;
	/** The consumer was asked to go back to the latest page; the list goes to the bottom once it has. */
	isJumpingToLatest: boolean;
};

/**
 * How the rows at the end of the list changed: the viewer's own message, someone else's message arriving live, or a page of
 * newer messages the list asked for.
 */
export type MessageListTailChange = 'own' | 'live' | 'page';

export type MessageListScrollEvent =
	| { type: 'userInput' }
	| { type: 'keyboardNavigation' }
	| ({ type: 'scroll' } & MessageListMeasurement)
	| { type: 'scrollEnd' }
	| ({ type: 'resize' } & MessageListMeasurement)
	| ({
			type: 'dataCommitted';
			change: MessageKeysChange;
			rows: MessageListRowsSnapshot;
			tail: MessageListTailChange | undefined;
	  } & MessageListMeasurement)
	| { type: 'targetChanged'; messageId: string | undefined }
	| { type: 'loadSettled' }
	| { type: 'positioningTimeout' }
	| { type: 'messageAnchorExpired' }
	| { type: 'scrollToBottomRequested' }
	| { type: 'scrollToTopRequested' };

export type MessageListScrollCommand =
	| { type: 'scrollToIndex'; index: number; align: 'start' | 'center' | 'end'; offset?: number }
	| { type: 'preserveTopVisibleMessage' }
	| { type: 'loadOlder' }
	| { type: 'loadNewer' }
	| { type: 'jumpToLatest' }
	| { type: 'highlight'; messageId: string }
	| { type: 'targetReached'; messageId: string }
	| { type: 'notifyVisibility' };

export type MessageListScrollResult = {
	state: MessageListScrollState;
	commands: MessageListScrollCommand[];
};

const BOTTOM: MessageListAnchor = { type: 'bottom' };
const NONE: MessageListAnchor = { type: 'none' };

const centeredOn = (messageId: string): MessageListAnchor => ({ type: 'message', messageId, align: 'center', offset: 0 });

export const createInitialScrollState = ({
	rows,
	targetMessageId,
	restoreTarget = { type: 'bottom' },
}: {
	rows: MessageListRowsSnapshot;
	targetMessageId?: string;
	restoreTarget?: RestoreTarget;
}): MessageListScrollState => {
	const anchorFromRestore: MessageListAnchor =
		restoreTarget.type === 'message'
			? { type: 'message', messageId: restoreTarget.messageId, align: 'start', offset: restoreTarget.offset }
			: BOTTOM;

	return {
		anchor: targetMessageId ? centeredOn(targetMessageId) : anchorFromRestore,
		phase: 'positioning',
		userScrolling: false,
		rows,
		measurement: undefined,
		loading: undefined,
		hasNewMessages: false,
		pendingTargetId: targetMessageId,
		isJumpingToLatest: false,
	};
};

const isAtLatestBottom = (state: MessageListScrollState) =>
	!!state.measurement && !state.rows.hasNewerMessages && isAtBottom(state.measurement.geometry);

/**
 * Scrolls to the anchor, unless it is already where it should be. Each call resolves the anchor's index again, so it follows
 * rows added or removed before it.
 */
const applyAnchor = (state: MessageListScrollState, { force = false } = {}): MessageListScrollCommand[] => {
	const { anchor, rows } = state;

	if (anchor.type === 'bottom') {
		if (rows.lastIndex < 0 || (!force && state.measurement && isAtBottom(state.measurement.geometry))) {
			return [];
		}
		return [{ type: 'scrollToIndex', index: rows.lastIndex, align: 'end' }];
	}

	if (anchor.type === 'message') {
		const index = rows.keys.indexOf(anchor.messageId);
		if (index === -1) {
			return [];
		}
		return [{ type: 'scrollToIndex', index, align: anchor.align, ...(anchor.offset && { offset: anchor.offset }) }];
	}

	return [];
};

/**
 * Loads a page when the viewport is close to an edge with more messages behind it. Only one page loads at a time, and never
 * while the list is placing itself or holding a message in view.
 */
const checkPaging = (state: MessageListScrollState): MessageListScrollResult => {
	const { phase, anchor, loading, measurement, rows } = state;

	if (phase !== 'idle' || anchor.type === 'message' || loading || !measurement) {
		return { state, commands: [] };
	}

	if (rows.hasOlderMessages && isNearOlderEdge(measurement.geometry, measurement.messagesStart)) {
		return { state: { ...state, loading: 'older' }, commands: [{ type: 'loadOlder' }] };
	}

	if (rows.hasNewerMessages && isNearNewerEdge(measurement.geometry)) {
		return { state: { ...state, loading: 'newer' }, commands: [{ type: 'loadNewer' }] };
	}

	return { state, commands: [] };
};

const withAnchor = (state: MessageListScrollState, anchor: MessageListAnchor): MessageListScrollState => ({
	...state,
	anchor,
	hasNewMessages: anchor.type === 'bottom' ? false : state.hasNewMessages,
});

const jumpTo = (state: MessageListScrollState, messageId: string): MessageListScrollResult => {
	const next = withAnchor({ ...state, pendingTargetId: undefined, isJumpingToLatest: false }, centeredOn(messageId));

	return {
		state: next,
		commands: [...applyAnchor(next, { force: true }), { type: 'highlight', messageId }, { type: 'targetReached', messageId }],
	};
};

const goToLatest = (state: MessageListScrollState): MessageListScrollResult => {
	if (state.rows.hasNewerMessages) {
		return {
			state: { ...withAnchor(state, NONE), isJumpingToLatest: true, pendingTargetId: undefined },
			commands: [{ type: 'jumpToLatest' }],
		};
	}

	const next = withAnchor({ ...state, pendingTargetId: undefined }, BOTTOM);
	return { state: next, commands: applyAnchor(next, { force: true }) };
};

const onScroll = (state: MessageListScrollState, measurement: MessageListMeasurement): MessageListScrollResult => {
	let next: MessageListScrollState = { ...state, measurement };
	const atLatestBottom = isAtLatestBottom(next);

	if (next.userScrolling && next.anchor.type !== 'message') {
		next = withAnchor(next, atLatestBottom ? BOTTOM : NONE);
	} else if (next.anchor.type === 'none' && atLatestBottom) {
		next = withAnchor(next, BOTTOM);
	}

	const paged = checkPaging(next);
	return { state: paged.state, commands: [{ type: 'notifyVisibility' }, ...paged.commands] };
};

const anchorAfterCommit = (
	state: MessageListScrollState,
	change: MessageKeysChange,
	tail: MessageListTailChange | undefined,
): { state: MessageListScrollState; commands: MessageListScrollCommand[] } => {
	if (state.pendingTargetId && state.rows.keys.includes(state.pendingTargetId)) {
		return jumpTo(state, state.pendingTargetId);
	}

	if (state.isJumpingToLatest && !state.rows.hasNewerMessages) {
		const next = withAnchor({ ...state, isJumpingToLatest: false }, BOTTOM);
		return { state: next, commands: applyAnchor(next, { force: true }) };
	}

	if (tail === 'own') {
		return goToLatest(state);
	}

	let next = state;

	if (tail === 'live' && next.anchor.type !== 'bottom' && !next.rows.hasNewerMessages) {
		next = { ...next, hasNewMessages: true };
	}

	if (change === 'replace' && next.anchor.type === 'none' && !next.isJumpingToLatest && !next.pendingTargetId) {
		next = withAnchor(next, BOTTOM);
	}

	if (change === 'reorder' && next.anchor.type === 'none') {
		return { state: next, commands: [{ type: 'preserveTopVisibleMessage' }] };
	}

	return { state: next, commands: applyAnchor(next) };
};

/**
 * Decides how a message list scrolls. The anchor is what the list keeps in view: the bottom, a message, or nothing. Only the
 * viewer's own input releases an anchor; scroll events alone can only take the list back to the bottom.
 */
export const messageListScrollReducer = (state: MessageListScrollState, event: MessageListScrollEvent): MessageListScrollResult => {
	switch (event.type) {
		case 'userInput': {
			return {
				state: {
					...state,
					userScrolling: true,
					phase: 'idle',
					anchor: state.anchor.type === 'message' ? NONE : state.anchor,
				},
				commands: [],
			};
		}

		case 'keyboardNavigation': {
			return { state: { ...state, phase: 'idle', anchor: NONE }, commands: [] };
		}

		case 'scroll': {
			return onScroll(state, { geometry: event.geometry, messagesStart: event.messagesStart });
		}

		case 'scrollEnd': {
			return { state: { ...state, userScrolling: false }, commands: [{ type: 'notifyVisibility' }] };
		}

		case 'resize': {
			const next = { ...state, measurement: { geometry: event.geometry, messagesStart: event.messagesStart } };
			return { state: next, commands: applyAnchor(next) };
		}

		case 'dataCommitted': {
			const committed: MessageListScrollState = {
				...state,
				rows: event.rows,
				measurement: { geometry: event.geometry, messagesStart: event.messagesStart },
			};
			const anchored = anchorAfterCommit(committed, event.change, event.tail);
			const paged = checkPaging(anchored.state);
			return { state: paged.state, commands: [...anchored.commands, ...paged.commands, { type: 'notifyVisibility' }] };
		}

		case 'targetChanged': {
			if (!event.messageId) {
				return { state: { ...state, pendingTargetId: undefined }, commands: [] };
			}

			if (state.rows.keys.includes(event.messageId)) {
				return jumpTo(state, event.messageId);
			}

			return { state: { ...withAnchor(state, NONE), pendingTargetId: event.messageId, isJumpingToLatest: false }, commands: [] };
		}

		case 'loadSettled': {
			return { state: { ...state, loading: undefined }, commands: [] };
		}

		case 'positioningTimeout': {
			if (state.phase !== 'positioning') {
				return { state, commands: [] };
			}
			const paged = checkPaging({ ...state, phase: 'idle' });
			return { state: paged.state, commands: [{ type: 'notifyVisibility' }, ...paged.commands] };
		}

		case 'messageAnchorExpired': {
			if (state.anchor.type !== 'message') {
				return { state, commands: [] };
			}
			return checkPaging(withAnchor(state, isAtLatestBottom(state) ? BOTTOM : NONE));
		}

		case 'scrollToBottomRequested': {
			return goToLatest({ ...state, phase: 'idle' });
		}

		case 'scrollToTopRequested': {
			return {
				state: withAnchor({ ...state, phase: 'idle', pendingTargetId: undefined }, NONE),
				commands: state.rows.lastIndex < 0 ? [] : [{ type: 'scrollToIndex', index: 0, align: 'start' }],
			};
		}
	}
};
