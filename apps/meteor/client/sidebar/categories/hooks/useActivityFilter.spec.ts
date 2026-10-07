import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { isActivityFilterable, useActivityFilter, useActivityFilterClock } from './useActivityFilter';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

const dispatchToastMessage = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
	useToastMessageDispatch: () => dispatchToastMessage,
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
	mutateAsync.mockReset().mockResolvedValue(undefined);
	dispatchToastMessage.mockClear();
	mockedUseUserPreference.mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	mockedUsePersistCategoriesMutation.mockReturnValue({ mutateAsync } as any);
	withCategories([]);
});

it('reads the filter stored on the group entry', () => {
	withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 168 }]);

	const { result } = renderHook(() => useActivityFilter());

	expect(result.current.getActivityFilterHours('Channels')).toBe(168);
	expect(result.current.getActivityFilterHours('Direct_Messages')).toBeUndefined();
	expect(result.current.hasActivityFilters).toBe(true);
});

it('keeps both changes when two are made before the preference catches up', async () => {
	withCategories([
		{ _id: 'Channels', name: 'Channels', default: true },
		{ _id: 'custom', name: 'Work' },
	]);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await Promise.all([result.current.setActivityFilterHours('Channels', 24), result.current.setActivityFilterHours('custom', 168)]);
	});

	expect(mutateAsync).toHaveBeenCalledTimes(2);
	expect(mutateAsync.mock.calls[1][0]).toEqual([
		{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 24 },
		{ _id: 'custom', name: 'Work', activityFilterHours: 168 },
	]);
});

it('tells the user when the filter could not be saved', async () => {
	withCategories([{ _id: 'custom', name: 'Work' }]);
	const error = new Error('network down');
	mutateAsync.mockRejectedValueOnce(error);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilterHours('custom', 24);
	});

	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: error });
});

it('stores a filter on a custom category', async () => {
	withCategories([{ _id: 'custom', name: 'Work' }]);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilterHours('custom', 24);
	});

	expect(persistedEntry('custom')).toEqual({ _id: 'custom', name: 'Work', activityFilterHours: 24 });
});

it('creates the entry of a system group that has none yet', async () => {
	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilterHours('Channels', 720);
	});

	expect(persistedEntry('Channels')).toEqual({ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 720 });
});

it('clears the filter', async () => {
	withCategories([{ _id: 'custom', name: 'Work', activityFilterHours: 168 }]);

	const { result } = renderHook(() => useActivityFilter());

	await act(async () => {
		await result.current.setActivityFilterHours('custom', undefined);
	});

	expect(persistedEntry('custom')?.activityFilterHours).toBeUndefined();
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
