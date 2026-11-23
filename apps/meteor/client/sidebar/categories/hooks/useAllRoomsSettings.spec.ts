import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { useAllRoomsGroupKeys, useAllRoomsSettings } from './useAllRoomsSettings';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
}));

jest.mock('./usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

const mutate = jest.fn();

const persisted = (): ISidebarCategory[] => mutate.mock.calls[0][0];
const persistedEntry = (id: string): ISidebarCategory | undefined => persisted().find((entry) => entry._id === id);

const withCategories = (rawCategories: ISidebarCategory[]) =>
	jest
		.mocked(useUserSidebarCategories)
		.mockReturnValue({ rawCategories, customCategories: rawCategories.filter((entry) => !entry.default) });

const STATIC_GROUPS = ['Favorites', 'Teams', 'Discussions', 'Channels', 'Direct_Messages', 'Conversations'];

beforeEach(() => {
	mutate.mockClear();
	jest.mocked(useUserPreference).mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate } as any);
	withCategories([]);
});

describe('useAllRoomsGroupKeys', () => {
	it('lists the static system groups and the custom categories, never the dynamic groups', () => {
		withCategories([
			{ _id: 'Unread', name: 'Unread', default: true, activityFilterHours: 24 },
			{ _id: 'work', name: 'Work' },
		]);

		const { result } = renderHook(() => useAllRoomsGroupKeys());

		expect(result.current).toEqual(expect.arrayContaining([...STATIC_GROUPS, 'work']));
		expect(result.current).not.toContain('Unread');
		expect(result.current).not.toContain('Incoming_Calls');
	});
});

describe('useAllRoomsSettings', () => {
	it('reads a setting as the value every group shares, a missing entry counting as none', () => {
		withCategories([...STATIC_GROUPS, 'work'].map((id) => ({ _id: id, name: id, default: id !== 'work', activityFilterHours: 168 })));

		const { result } = renderHook(() => useAllRoomsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: 168 });
		expect(result.current.showUnreads).toEqual({ mixed: false, value: false });
		expect(result.current.keepUnreadsOnTop).toEqual({ mixed: false, value: false });
	});

	it('reads no filter at all as the shared value when no group has one', () => {
		const { result } = renderHook(() => useAllRoomsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: undefined });
	});

	it('reads a setting as mixed once one group differs, each setting on its own', () => {
		withCategories([
			{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 168, showUnreads: true },
			{ _id: 'work', name: 'Work', showUnreads: true },
		]);

		const { result } = renderHook(() => useAllRoomsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: true });
		// Only two groups have it on; the others read as off.
		expect(result.current.showUnreads).toEqual({ mixed: true });
		expect(result.current.keepUnreadsOnTop).toEqual({ mixed: false, value: false });
	});

	it('ignores what a dynamic group has stored', () => {
		withCategories([{ _id: 'Unread', name: 'Unread', default: true, activityFilterHours: 24, showUnreads: true }]);

		const { result } = renderHook(() => useAllRoomsSettings());

		expect(result.current.activityFilterHours).toEqual({ mixed: false, value: undefined });
		expect(result.current.showUnreads).toEqual({ mixed: false, value: false });
	});

	it('writes the window to every static group and custom category, creating the entries that are missing', () => {
		withCategories([
			{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 },
			{ _id: 'work', name: 'Work', activityFilterHours: 720, showUnreads: true },
		]);

		const { result } = renderHook(() => useAllRoomsSettings());

		act(() => result.current.setActivityFilterHours(168));

		expect(mutate).toHaveBeenCalledTimes(1);
		for (const id of [...STATIC_GROUPS, 'work']) {
			expect(persistedEntry(id)?.activityFilterHours).toBe(168);
		}
		// The rest of an entry is kept, and the dynamic groups are listed untouched.
		expect(persistedEntry('work')).toEqual({ _id: 'work', name: 'Work', activityFilterHours: 168, showUnreads: true });
		expect(persistedEntry('Unread')).toEqual({ _id: 'Unread', name: 'Unread', default: true });
		expect(
			persisted()
				.map((entry) => entry._id)
				.slice(0, 5),
		).toEqual(['Incoming_Calls', 'Incoming_Livechats', 'Open_Livechats', 'On_Hold_Chats', 'Unread']);
	});

	it('clears the window everywhere', () => {
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 }]);

		const { result } = renderHook(() => useAllRoomsSettings());

		act(() => result.current.setActivityFilterHours(undefined));

		expect(persistedEntry('Channels')).toEqual({ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: undefined });
	});

	it('writes the unread toggles to every group, keeping their windows', () => {
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 }]);

		const { result } = renderHook(() => useAllRoomsSettings());

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
