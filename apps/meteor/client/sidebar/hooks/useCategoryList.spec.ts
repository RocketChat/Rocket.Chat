import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { SIDEBAR_DYNAMIC_GROUP_KEYS, mergeWithSectionsOrder, useCategoryList, withDynamicFirst } from './useCategoryList';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useSetting: jest.fn(),
	useUserPreference: jest.fn(),
}));

jest.mock('../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: jest.fn(),
}));

const mockedUseSetting = jest.mocked(useSetting);
const mockedUseUserPreference = jest.mocked(useUserPreference);
const mockedUseHasLicenseModule = jest.mocked(useHasLicenseModule);

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

describe('useCategoryList', () => {
	const preferences: Record<string, unknown> = {};
	let hasLicenseModule = false;

	beforeEach(() => {
		for (const key of Object.keys(preferences)) delete preferences[key];
		Object.assign(preferences, { sidebarGroupByType: false, sidebarShowFavorites: true, sidebarShowUnread: true });
		hasLicenseModule = false;

		mockedUseUserPreference.mockImplementation((key: string, defaultValue?: unknown) => preferences[key] ?? defaultValue);
		mockedUseSetting.mockImplementation((_key: string, defaultValue?: unknown) => defaultValue);
		mockedUseHasLicenseModule.mockImplementation(() => ({ data: hasLicenseModule }) as any);
	});

	const categoryList = () => renderHook(() => useCategoryList(false, false)).result.current;

	it('ignores a section key of a system group that no longer exists', () => {
		preferences.sidebarSectionsOrder = ['Incoming_Calls', 'Unread', 'Drafts', 'Favorites', 'Conversations'];

		expect(categoryList()).toEqual(['Incoming_Calls', 'Unread', 'Favorites', 'Conversations']);
	});

	it('ignores a stale section key with the license module enabled', () => {
		hasLicenseModule = true;
		preferences.sidebarSectionsOrder = ['Incoming_Calls', 'Unread', 'Drafts', 'Favorites', 'Conversations'];

		expect(categoryList()).not.toContain('Drafts');
	});

	it('ignores a stale entry already persisted in sidebarCategories', () => {
		hasLicenseModule = true;
		preferences.sidebarSectionsOrder = ['Incoming_Calls', 'Unread', 'Favorites', 'Conversations'];
		preferences.sidebarCategories = [
			{ _id: 'Drafts', name: 'Drafts', default: true },
			{ _id: 'custom-xyz', name: 'Work' },
		];

		const result = categoryList();
		expect(result).not.toContain('Drafts');
		expect(result).toContain('custom-xyz');
	});
});
