import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { isActivityFilterable, useActivityFilterClock, useActivityFilterHours, useSetActivityFilterHours } from './useActivityFilter';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
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

jest.mock('../../../hooks/useIsEnterprise', () => ({
	useIsEnterprise: jest.fn(),
}));

const mockedUseIsEnterprise = jest.mocked(useIsEnterprise);
const mockedUseUserPreference = jest.mocked(useUserPreference);
const mockedUsePersistCategoriesMutation = jest.mocked(usePersistCategoriesMutation);
const mockedUseUserSidebarCategories = jest.mocked(useUserSidebarCategories);

const mutate = jest.fn();

const persistedEntry = (id: string): ISidebarCategory | undefined =>
	mutate.mock.calls[0][0].find((entry: ISidebarCategory) => entry._id === id);

const withCategories = (rawCategories: ISidebarCategory[]) =>
	mockedUseUserSidebarCategories.mockReturnValue({ rawCategories, customCategories: rawCategories.filter((entry) => !entry.default) });

beforeEach(() => {
	mutate.mockClear();
	mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: true } } as any);
	mockedUseUserPreference.mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	mockedUsePersistCategoriesMutation.mockReturnValue({ mutate } as any);
	withCategories([]);
});

describe('useActivityFilterHours', () => {
	it('reads the filter stored on the group entry', () => {
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 168 }]);

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Channels')).toBe(168);
		expect(result.current.getActivityFilterHours('Direct_Messages')).toBeUndefined();
		expect(result.current.hasActivityFilters).toBe(true);
	});

	it('reads no filter without the license module', () => {
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: false } } as any);
		withCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 168 }]);

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Channels')).toBeUndefined();
		expect(result.current.hasActivityFilters).toBe(false);
	});

	it('reads no filter on a dynamic group, whatever its entry says', () => {
		withCategories([{ _id: 'Unread', name: 'Unread', default: true, activityFilterHours: 24 }]);

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Unread')).toBeUndefined();
		expect(result.current.hasActivityFilters).toBe(false);
	});
});

describe('useSetActivityFilterHours', () => {
	it('stores a filter on a custom category', () => {
		withCategories([{ _id: 'custom', name: 'Work' }]);

		const { result } = renderHook(() => useSetActivityFilterHours());

		act(() => result.current('custom', 24));

		expect(persistedEntry('custom')).toEqual({ _id: 'custom', name: 'Work', activityFilterHours: 24 });
	});

	it('creates the entry of a system group that has none yet', () => {
		const { result } = renderHook(() => useSetActivityFilterHours());

		act(() => result.current('Channels', 720));

		expect(persistedEntry('Channels')).toEqual({ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 720 });
	});

	it('clears the filter', () => {
		withCategories([{ _id: 'custom', name: 'Work', activityFilterHours: 168 }]);

		const { result } = renderHook(() => useSetActivityFilterHours());

		act(() => result.current('custom', undefined));

		expect(persistedEntry('custom')?.activityFilterHours).toBeUndefined();
	});
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
