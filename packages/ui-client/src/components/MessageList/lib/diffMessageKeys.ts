export type MessageKeysDiff = {
	removedHead: number;
	addedHead: number;
	addedTail: number;
	removedTail: number;
	/** Keys changed somewhere other than the two ends, or the kept keys changed order. */
	middleChanged: boolean;
	/** No key survived: the list now shows another window of the conversation. */
	replaced: boolean;
};

const unchanged: MessageKeysDiff = {
	removedHead: 0,
	addedHead: 0,
	addedTail: 0,
	removedTail: 0,
	middleChanged: false,
	replaced: false,
};

/**
 * Describes how a list of keys changed at each end, which is what decides how the scroll position is kept.
 */
export const diffMessageKeys = (previousKeys: readonly string[], nextKeys: readonly string[]): MessageKeysDiff => {
	if (previousKeys.length === 0 && nextKeys.length === 0) {
		return unchanged;
	}

	const nextIndexes = new Map(nextKeys.map((key, index) => [key, index]));

	const removedHead = previousKeys.findIndex((key) => nextIndexes.has(key));
	if (removedHead === -1) {
		return { ...unchanged, replaced: true };
	}

	const addedHead = nextIndexes.get(previousKeys[removedHead]) ?? 0;

	let previousIndex = removedHead;
	let nextIndex = addedHead;
	while (previousIndex < previousKeys.length && nextIndex < nextKeys.length && previousKeys[previousIndex] === nextKeys[nextIndex]) {
		previousIndex++;
		nextIndex++;
	}

	if (previousIndex === previousKeys.length) {
		return { ...unchanged, removedHead, addedHead, addedTail: nextKeys.length - nextIndex };
	}

	const restRemoved = previousKeys.slice(previousIndex).every((key) => !nextIndexes.has(key));
	if (restRemoved && nextIndex === nextKeys.length) {
		return { ...unchanged, removedHead, addedHead, removedTail: previousKeys.length - previousIndex };
	}

	return { ...unchanged, removedHead, addedHead, middleChanged: true };
};

export type MessageKeysChange = 'none' | 'prepend' | 'append' | 'prependAndAppend' | 'reorder' | 'replace';

/**
 * Classifies a diff by what it asks of the virtualizer: a change at the start is absorbed by its shift mode, a change at
 * the end is not, and both at once must be committed in two steps.
 */
export const classifyMessageKeysDiff = ({
	removedHead,
	addedHead,
	addedTail,
	removedTail,
	middleChanged,
	replaced,
}: MessageKeysDiff): MessageKeysChange => {
	if (replaced) {
		return 'replace';
	}

	if (middleChanged) {
		return 'reorder';
	}

	const changedHead = removedHead > 0 || addedHead > 0;
	const changedTail = addedTail > 0 || removedTail > 0;

	if (changedHead && changedTail) {
		return 'prependAndAppend';
	}

	if (changedHead) {
		return 'prepend';
	}

	if (changedTail) {
		return 'append';
	}

	return 'none';
};
