import type { MessageKeysChange } from '../lib/diffMessageKeys';
import { classifyMessageKeysDiff, diffMessageKeys } from '../lib/diffMessageKeys';

export type RowsCommitPlan = {
	change: MessageKeysChange;
	/** How many of the next rows to render now; fewer than all when the commit is staged. */
	renderedLength: number;
	shift: boolean;
};

/**
 * Decides how the next rows reach the virtualizer. Its shift mode keeps the visible rows in place when rows are added or
 * removed at the start, and must be off for changes anywhere else; a change at both ends is therefore committed in two
 * steps: up to the last row already rendered with shift on, then the rest with shift off.
 */
export const planRowsCommit = (renderedKeys: readonly string[], nextKeys: readonly string[]): RowsCommitPlan => {
	const diff = diffMessageKeys(renderedKeys, nextKeys);
	const change = classifyMessageKeysDiff(diff);

	if (change === 'prependAndAppend') {
		const lastKept = renderedKeys.length - diff.removedTail - 1;
		return { change: 'prepend', renderedLength: nextKeys.indexOf(renderedKeys[lastKept]) + 1, shift: true };
	}

	return { change, renderedLength: nextKeys.length, shift: change === 'prepend' };
};
