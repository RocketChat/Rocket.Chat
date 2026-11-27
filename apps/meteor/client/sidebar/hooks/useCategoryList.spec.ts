import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDEBAR_DYNAMIC_GROUP_KEYS, getRoomCategory, mergeWithSectionsOrder, withDynamicFirst } from './useCategoryList';

const STATIC_KEYS = ['Favorites', 'Teams', 'Discussions', 'Channels', 'Direct_Messages', 'Conversations'] as const;
const DYNAMIC_KEYS = [...SIDEBAR_DYNAMIC_GROUP_KEYS];
const ALL_KEYS = [...DYNAMIC_KEYS, ...STATIC_KEYS];

describe('mergeWithSectionsOrder', () => {
	it('inserts a missing key before its first successor already in the list', () => {
		const result = mergeWithSectionsOrder(['Favorites', 'Channels'], ALL_KEYS);
		expect(result.indexOf('Unread')).toBeLessThan(result.indexOf('Favorites'));
	});

	it('does not move keys that are already present', () => {
		const result = mergeWithSectionsOrder(['Channels', 'Favorites'], ALL_KEYS);
		expect(result.indexOf('Channels')).toBeLessThan(result.indexOf('Favorites'));
	});

	it('appends a key with no successor in the list to the end', () => {
		const result = mergeWithSectionsOrder(['Favorites'], ALL_KEYS);
		expect(result.at(-1)).toBe('Conversations');
	});

	it('returns all sectionsOrder keys when explicitIds is empty', () => {
		const result = mergeWithSectionsOrder([], ALL_KEYS);
		expect(result).toEqual(ALL_KEYS);
	});
});

describe('withDynamicFirst', () => {
	it('places all dynamic groups before any static group', () => {
		const result = withDynamicFirst(['Favorites', 'Channels'], ALL_KEYS);
		const lastDynamicIdx = Math.max(...DYNAMIC_KEYS.map((k) => result.indexOf(k)));
		const firstStaticIdx = Math.min(...STATIC_KEYS.map((k) => result.indexOf(k)));
		expect(lastDynamicIdx).toBeLessThan(firstStaticIdx);
	});

	it('includes all dynamic keys from sectionsOrder even if absent from ids', () => {
		const result = withDynamicFirst(['Favorites'], ALL_KEYS);
		for (const dk of DYNAMIC_KEYS) {
			expect(result).toContain(dk);
		}
	});

	it('places a new custom category first among static groups', () => {
		const customId = 'custom-xyz';
		const result = withDynamicFirst([customId, 'Favorites', 'Channels'], ALL_KEYS);
		for (const dk of DYNAMIC_KEYS) {
			expect(result.indexOf(dk)).toBeLessThan(result.indexOf(customId));
		}
		expect(result.indexOf(customId)).toBeLessThan(result.indexOf('Favorites'));
		expect(result.indexOf(customId)).toBeLessThan(result.indexOf('Channels'));
	});

	it('preserves user-defined order among static groups', () => {
		const result = withDynamicFirst(['Channels', 'Favorites'], ALL_KEYS);
		expect(result.indexOf('Channels')).toBeLessThan(result.indexOf('Favorites'));
	});

	it('corrects a dynamic group that was placed in the middle of statics', () => {
		const result = withDynamicFirst(['Favorites', 'Unread', 'Channels'], ALL_KEYS);
		expect(result.indexOf('Unread')).toBeLessThan(result.indexOf('Favorites'));
		expect(result.indexOf('Unread')).toBeLessThan(result.indexOf('Channels'));
		expect(result.indexOf('Favorites')).toBeLessThan(result.indexOf('Channels'));
	});
});

describe('getRoomCategory', () => {
	const readFavorite = { rid: 'a', t: 'c', f: true, unread: 0, alert: false } as unknown as SubscriptionWithRoom;
	const groupsOf = (...keys: string[]) => new Map(keys.map((key) => [key, new Set<SubscriptionWithRoom>()]));
	const noCalls = () => false;

	it('lists the sticky room in Unread although it is read', () => {
		expect(
			getRoomCategory(readFavorite, { groups: groupsOf('Unread', 'Favorites'), hasIncomingCalls: noCalls, stickyUnreadRid: 'a' }),
		).toBe('Unread');
	});

	it('lists the sticky room in its own group when there is no Unread group', () => {
		expect(getRoomCategory(readFavorite, { groups: groupsOf('Favorites'), hasIncomingCalls: noCalls, stickyUnreadRid: 'a' })).toBe(
			'Favorites',
		);
	});

	it('lists the sticky room in its own group once its unread status is hidden', () => {
		const hidden = { ...readFavorite, hideUnreadStatus: true } as SubscriptionWithRoom;

		expect(getRoomCategory(hidden, { groups: groupsOf('Unread', 'Favorites'), hasIncomingCalls: noCalls, stickyUnreadRid: 'a' })).toBe(
			'Favorites',
		);
	});

	it('lists a read room that is not sticky in its own group', () => {
		expect(
			getRoomCategory(readFavorite, { groups: groupsOf('Unread', 'Favorites'), hasIncomingCalls: noCalls, stickyUnreadRid: 'b' }),
		).toBe('Favorites');
	});
});
