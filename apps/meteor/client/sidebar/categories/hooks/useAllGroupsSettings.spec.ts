import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { useAllGroupsGroupKeys, useAllGroupsSettings } from './useAllGroupsSettings';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
	useUserId: () => 'user-1',
}));

jest.mock('./usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

const mutate = jest.fn();

const withCategories = (rawCategories: ISidebarCategory[]) =>
	jest
		.mocked(useUserSidebarCategories)
		.mockReturnValue({ rawCategories, customCategories: rawCategories.filter((entry) => !entry.default) });

const STATIC_GROUPS = ['Favorites', 'Teams', 'Discussions', 'Channels', 'Direct_Messages', 'Conversations'];

// UI-PREVIEW ONLY: the activity filters live in localStorage, under the key fuselage-hooks derives.
const STORAGE_KEY = 'fuselage-localStorage-sidebarActivityFilters-user-1';
const storedFilters = (): Record<string, number> => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const withStoredFilters = (filters: Record<string, number>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));

beforeEach(() => {
	localStorage.clear();
	mutate.mockClear();
	jest.mocked(useUserPreference).mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate } as any);
	withCategories([]);
});

describe('useAllGroupsGroupKeys', () => {
	it('lists the static system groups and the custom categories, never the dynamic groups', () => {
		withCategories([
			{ _id: 'Unread', name: 'Unread', default: true, activityFilterHours: 24 },
			{ _id: 'work', name: 'Work' },
		]);

		const { result } = renderHook(() => useAllGroupsGroupKeys());

		expect(result.current).toEqual(expect.arrayContaining([...STATIC_GROUPS, 'work']));
		expect(result.current).not.toContain('Unread');
		expect(result.current).not.toContain('Incoming_Calls');
	});
});

describe('useAllGroupsSettings', () => {
	it('reads a setting as the value every group shares, a missing entry counting as none', () => {
		withCategories([{ _id: 'work', name: 'Work' }]);
		withStoredFilters(Object.fromEntries([...STATIC_GROUPS, 'work'].map((id) => [id, 168])));

		const { result } = renderHook(() => useAllGroupsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: 168 });
		expect(result.current.showUnreads).toEqual({ mixed: false, value: false });
		expect(result.current.keepUnreadsOnTop).toEqual({ mixed: false, value: false });
	});

	it('reads no filter at all as the shared value when no group has one', () => {
		const { result } = renderHook(() => useAllGroupsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: undefined });
	});

	it('reads a setting as mixed once one group differs, each setting on its own', () => {
		withCategories([
			{ _id: 'Channels', name: 'Channels', default: true, showUnreads: true },
			{ _id: 'work', name: 'Work', showUnreads: true },
		]);
		withStoredFilters({ Channels: 168 });

		const { result } = renderHook(() => useAllGroupsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: true });
		// Only two groups have it on; the others read as off.
		expect(result.current.showUnreads).toEqual({ mixed: true });
		expect(result.current.keepUnreadsOnTop).toEqual({ mixed: false, value: false });
	});

	it('ignores what a dynamic group has stored', () => {
		withCategories([{ _id: 'Unread', name: 'Unread', default: true, showUnreads: true }]);
		withStoredFilters({ Unread: 24 });

		const { result } = renderHook(() => useAllGroupsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: undefined });
		expect(result.current.showUnreads).toEqual({ mixed: false, value: false });
	});

	it('writes the window for every static group and custom category, leaving the dynamic groups alone', () => {
		withCategories([{ _id: 'work', name: 'Work', showUnreads: true }]);
		withStoredFilters({ Channels: 24, work: 720, Unread: 24 });

		const { result } = renderHook(() => useAllGroupsSettings());

		act(() => result.current.setActivityFilterHours(168));

		// UI-PREVIEW ONLY: the windows go to localStorage, not to the preference.
		expect(mutate).not.toHaveBeenCalled();
		expect(storedFilters()).toEqual({ ...Object.fromEntries([...STATIC_GROUPS, 'work'].map((id) => [id, 168])), Unread: 24 });
	});

	it('clears the window everywhere', () => {
		withStoredFilters({ Channels: 24, Teams: 168 });

		const { result } = renderHook(() => useAllGroupsSettings());

		act(() => result.current.setActivityFilterHours(undefined));

		expect(storedFilters()).toEqual({});
	});

	it('writes the unread toggles to every group, keeping their entries', () => {
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 }]);

		const { result } = renderHook(() => useAllGroupsSettings());

		act(() => result.current.setShowUnreads(true));
		act(() => result.current.setKeepUnreadsOnTop(true));

		expect(mutate.mock.calls[0][0].find((entry: ISidebarCategory) => entry._id === 'Channels')).toEqual({
			_id: 'Channels',
			name: 'Channels',
			default: true,
			activityFilterHours: 24,
			showUnreads: true,
		});
		expect(mutate.mock.calls[1][0].find((entry: ISidebarCategory) => entry._id === 'Teams')).toEqual({
			_id: 'Teams',
			name: 'Teams',
			default: true,
			keepUnreadsOnTop: true,
		});
	});
});
