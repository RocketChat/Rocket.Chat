import type { CacheSnapshot } from 'virtua';

/**
 * Where a list was left, to come back to it later. Opaque to the consumer, which only stores and hands it back.
 */
export type MessageListPosition = {
	isAtBottom: boolean;
	anchorMessageId: string | undefined;
	/** How far the viewport top was below the top of the anchor message, in pixels. */
	offsetWithinAnchor: number;
	cache?: CacheSnapshot;
	cacheKeys: { first: string | undefined; last: string | undefined; length: number };
	width: number;
};

export type RestoreTarget = { type: 'bottom' } | { type: 'message'; messageId: string; offset: number };

export const resolveRestoreTarget = (
	position: MessageListPosition | undefined,
	hasMessage: (messageId: string) => boolean,
): RestoreTarget => {
	if (!position || position.isAtBottom || !position.anchorMessageId || !hasMessage(position.anchorMessageId)) {
		return { type: 'bottom' };
	}

	return { type: 'message', messageId: position.anchorMessageId, offset: position.offsetWithinAnchor };
};

/**
 * The virtualizer's measurement cache is positional, so it only helps when the rows it measured are still the first ones,
 * in the same order, at the same width.
 */
export const getReusableCache = (position: MessageListPosition | undefined, keys: readonly string[], width: number) => {
	if (!position?.cache || position.width !== width) {
		return undefined;
	}

	const { first, last, length } = position.cacheKeys;
	if (length === 0 || keys.length < length || keys[0] !== first || keys[length - 1] !== last) {
		return undefined;
	}

	return position.cache;
};

export const describeCacheKeys = (keys: readonly string[]): MessageListPosition['cacheKeys'] => ({
	first: keys[0],
	last: keys[keys.length - 1],
	length: keys.length,
});
