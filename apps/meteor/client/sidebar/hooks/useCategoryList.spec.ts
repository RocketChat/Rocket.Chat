import { SIDEBAR_DYNAMIC_GROUP_KEYS, mergeWithSectionsOrder, withDynamicFirst } from './useCategoryList';

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
