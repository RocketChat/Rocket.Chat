import type { CacheSnapshot } from 'virtua';

import type { MessageListPosition } from './position';
import { describeCacheKeys, getReusableCache, resolveRestoreTarget } from './position';

const cache = {} as CacheSnapshot;

const position = (overrides: Partial<MessageListPosition> = {}): MessageListPosition => ({
	isAtBottom: false,
	anchorMessageId: 'b',
	offsetWithinAnchor: 12,
	cache,
	cacheKeys: describeCacheKeys(['a', 'b', 'c']),
	width: 800,
	...overrides,
});

describe('resolveRestoreTarget', () => {
	const has = (id: string) => ['a', 'b', 'c'].includes(id);

	it('should go to the bottom without a saved position (R62)', () => {
		expect(resolveRestoreTarget(undefined, has)).toEqual({ type: 'bottom' });
	});

	it('should go to the bottom when the list was left at the bottom (R60)', () => {
		expect(resolveRestoreTarget(position({ isAtBottom: true }), has)).toEqual({ type: 'bottom' });
	});

	it('should go back to the anchor message, at the same offset (R60)', () => {
		expect(resolveRestoreTarget(position(), has)).toEqual({ type: 'message', messageId: 'b', offset: 12 });
	});

	it('should go to the bottom when the anchor message is gone (R60)', () => {
		expect(resolveRestoreTarget(position({ anchorMessageId: 'z' }), has)).toEqual({ type: 'bottom' });
	});
});

describe('getReusableCache', () => {
	it('should reuse the cache when its rows are still the first ones (R63)', () => {
		expect(getReusableCache(position(), ['a', 'b', 'c'], 800)).toBe(cache);
		expect(getReusableCache(position(), ['a', 'b', 'c', 'd'], 800)).toBe(cache);
	});

	it('should not reuse the cache at another width (R63)', () => {
		expect(getReusableCache(position(), ['a', 'b', 'c'], 600)).toBeUndefined();
	});

	it('should not reuse the cache when a message was deleted and another arrived, keeping the same count (R63)', () => {
		expect(getReusableCache(position(), ['a', 'c', 'd'], 800)).toBeUndefined();
	});

	it('should not reuse the cache when older messages were added before its rows (R63)', () => {
		expect(getReusableCache(position(), ['z', 'a', 'b', 'c'], 800)).toBeUndefined();
	});

	it('should not reuse a missing cache (R63)', () => {
		expect(getReusableCache(position({ cache: undefined }), ['a', 'b', 'c'], 800)).toBeUndefined();
	});
});
