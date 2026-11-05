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

	it('should go to the bottom without a saved position', () => {
		expect(resolveRestoreTarget(undefined, has)).toEqual({ type: 'bottom' });
	});

	it('should go to the bottom when the list was left at the bottom', () => {
		expect(resolveRestoreTarget(position({ isAtBottom: true }), has)).toEqual({ type: 'bottom' });
	});

	it('should go back to the anchor message, at the same offset', () => {
		expect(resolveRestoreTarget(position(), has)).toEqual({ type: 'message', messageId: 'b', offset: 12 });
	});

	it('should go to the bottom when the anchor message is gone', () => {
		expect(resolveRestoreTarget(position({ anchorMessageId: 'z' }), has)).toEqual({ type: 'bottom' });
	});
});

describe('getReusableCache', () => {
	it('should reuse the cache when its rows are still the first ones', () => {
		expect(getReusableCache(position(), ['a', 'b', 'c'], 800)).toBe(cache);
		expect(getReusableCache(position(), ['a', 'b', 'c', 'd'], 800)).toBe(cache);
	});

	it('should not reuse the cache at another width', () => {
		expect(getReusableCache(position(), ['a', 'b', 'c'], 600)).toBeUndefined();
	});

	it('should not reuse the cache when a message was deleted and another arrived, keeping the same count', () => {
		expect(getReusableCache(position(), ['a', 'c', 'd'], 800)).toBeUndefined();
	});

	it('should not reuse the cache when older messages were added before its rows', () => {
		expect(getReusableCache(position(), ['z', 'a', 'b', 'c'], 800)).toBeUndefined();
	});

	it('should not reuse a missing cache', () => {
		expect(getReusableCache(position({ cache: undefined }), ['a', 'b', 'c'], 800)).toBeUndefined();
	});
});
