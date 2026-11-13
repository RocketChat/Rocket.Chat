import { HEADER_ROW_KEY, OLDER_LOADER_ROW_KEY } from '../lib/buildMessageListRows';
import type { MessageKeysChange } from '../lib/diffMessageKeys';
import { classifyMessageKeysDiff, diffMessageKeys } from '../lib/diffMessageKeys';

export type RowsCommitPlan = {
	change: MessageKeysChange;
	/** How many of the next rows to render now; fewer than all when the commit is staged. */
	renderedLength: number;
	shift: boolean;
};

/** The older loader or the header: the row that stays first while pages of older messages arrive under it. */
const splitHeadRow = (keys: readonly string[]) =>
	keys[0] === OLDER_LOADER_ROW_KEY || keys[0] === HEADER_ROW_KEY ? { head: keys[0], rest: keys.slice(1) } : { head: undefined, rest: keys };

const withHeadChange = (change: MessageKeysChange): MessageKeysChange => {
	if (change === 'none') {
		return 'prepend';
	}
	if (change === 'append') {
		return 'prependAndAppend';
	}
	return change;
};

/**
 * The first messages listed under a head row that was shown alone: under the older loader they are a page of older messages,
 * under the header, which stays, they arrive at the end.
 */
const firstMessagesUnder = (head: string | undefined, nextHead: string | undefined): MessageKeysChange | undefined => {
	if (head === OLDER_LOADER_ROW_KEY) {
		return 'prepend';
	}
	if (head === HEADER_ROW_KEY && nextHead === HEADER_ROW_KEY) {
		return 'append';
	}
	return undefined;
};

/**
 * Decides how the next rows reach the virtualizer. Its shift mode keeps the visible rows in place when rows are added or
 * removed at the start, and must be off for changes anywhere else; a change at both ends is therefore committed in two
 * steps: up to the last row already rendered with shift on, then the rest with shift off.
 *
 * A page of older messages lands under the older loader, so it is a change at the start, as is the header taking the
 * loader's place. Messages listed under a head row shown alone are a page or an arrival, not another window.
 */
export const planRowsCommit = (renderedKeys: readonly string[], nextKeys: readonly string[]): RowsCommitPlan => {
	const rendered = splitHeadRow(renderedKeys);
	const next = splitHeadRow(nextKeys);
	const diff = diffMessageKeys(rendered.rest, next.rest);
	const messagesChange = classifyMessageKeysDiff(diff);
	const firstMessages = rendered.rest.length === 0 && next.rest.length > 0 ? firstMessagesUnder(rendered.head, next.head) : undefined;
	const change = firstMessages ?? (rendered.head === next.head ? messagesChange : withHeadChange(messagesChange));

	if (change === 'prependAndAppend') {
		const lastKept = rendered.rest[rendered.rest.length - diff.removedTail - 1];
		return { change: 'prepend', renderedLength: nextKeys.indexOf(lastKept) + 1, shift: true };
	}

	return { change, renderedLength: nextKeys.length, shift: change === 'prepend' };
};
