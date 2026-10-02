import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { isActivityFilterable, useActivityFilter, useActivityFilterClock } from './useActivityFilter';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
}));

jest.mock('./usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

const mockedUseUserPreference = jest.mocked(useUserPreference);
const mockedUsePersistCategoriesMutation = jest.mocked(usePersistCategoriesMutation);
const mockedUseUserSidebarCategories = jest.mocked(useUserSidebarCategories);

const mutateAsync = jest.fn().mockResolvedValue(undefined);

const persistedEntry = (id: string): ISidebarCategory | undefined =>
	mutateAsync.mock.calls[0][0].find((entry: ISidebarCategory) => entry._id === id);

const withCategories = (rawCategories: ISidebarCategory[]) =>
	mockedUseUserSidebarCategories.mockReturnValue({ rawCategories, customCategories: rawCategories.filter((entry) => !entry.default) });

beforeEach(() => {
	mutateAsync.mockClear();
	mockedUseUserPreference.mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	mockedUsePersistCategoriesMutation.mockReturnValue({ mutateAsync } as any);
	withCategories([]);
});

it('reads the filter stored on the group entry', () => {
	withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilter: '7d' }]);

	const { result } = renderHook(() => useActivityFilter());

	expect(result.current.getActivityFilter('Channels')).toBe('7d');
	expect(result.current.getActivityFilter('Direct_Messages')).toBeUndefined();
	expect(result.current.hasActivityFilters).toBe(true);
});

it('stores a filter on a custom category', async () => {
	withCategories([{ _id: 'custom', name: 'Work' }]);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilter('custom', '1d');
	});

	expect(persistedEntry('custom')).toEqual({ _id: 'custom', name: 'Work', activityFilter: '1d' });
});

it('creates the entry of a system group that has none yet', async () => {
	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilter('Channels', '30d');
	});

	expect(persistedEntry('Channels')).toEqual({ _id: 'Channels', name: 'Channels', default: true, activityFilter: '30d' });
});

it('clears the filter', async () => {
	withCategories([{ _id: 'custom', name: 'Work', activityFilter: '7d' }]);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilter('custom', undefined);
	});

	expect(persistedEntry('custom')?.activityFilter).toBeUndefined();
});

it('never filters dynamic groups', () => {
	SIDEBAR_DYNAMIC_GROUP_KEYS.forEach((key) => expect(isActivityFilterable(key)).toBe(false));
	expect(isActivityFilterable('Channels')).toBe(true);
	expect(isActivityFilterable('custom')).toBe(true);
});

describe('useActivityFilterClock', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('moves forward while enabled', () => {
		const { result } = renderHook(() => useActivityFilterClock(true));
		const start = result.current;

		act(() => {
			jest.advanceTimersByTime(5 * 60 * 1000);
		});

		expect(result.current).toBeGreaterThan(start);
	});

	it('stands still while disabled', () => {
		const { result } = renderHook(() => useActivityFilterClock(false));
		const start = result.current;

		act(() => {
			jest.advanceTimersByTime(60 * 60 * 1000);
		});

		expect(result.current).toBe(start);
	});
});
