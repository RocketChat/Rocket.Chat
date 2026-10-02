import { act, renderHook } from '@testing-library/react';

import { isActivityFilterable, useActivityFilter, useActivityFilterClock } from './useActivityFilter';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

jest.mock('./usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

const STORAGE_KEY = 'fuselage-localStorage-sidebarActivityFilters';

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

beforeEach(() => {
	localStorage.clear();
});

it('reads the filter stored for a group', () => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ Channels: 168 }));

	const { result } = renderHook(() => useActivityFilter());

	expect(result.current.getActivityFilterHours('Channels')).toBe(168);
	expect(result.current.getActivityFilterHours('Direct_Messages')).toBeUndefined();
	expect(result.current.hasActivityFilters).toBe(true);
});

it('ignores a stored value that is not a whole number of hours', () => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ Channels: 'soon', Teams: 0 }));

	const { result } = renderHook(() => useActivityFilter());

	expect(result.current.getActivityFilterHours('Channels')).toBeUndefined();
	expect(result.current.getActivityFilterHours('Teams')).toBeUndefined();
	expect(result.current.hasActivityFilters).toBe(false);
});

it('stores a filter in the browser, not on the user preferences', () => {
	const { result } = renderHook(() => useActivityFilter());

	act(() => {
		result.current.setActivityFilterHours('custom', 24);
	});

	expect(stored()).toEqual({ custom: 24 });
	expect(result.current.getActivityFilterHours('custom')).toBe(24);
	expect(usePersistCategoriesMutation).not.toHaveBeenCalled();
});

it('keeps the other groups when one changes, and drops a cleared one', () => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ Channels: 168, custom: 24 }));

	const { result } = renderHook(() => useActivityFilter());

	act(() => {
		result.current.setActivityFilterHours('Channels', 720);
	});
	expect(stored()).toEqual({ Channels: 720, custom: 24 });

	act(() => {
		result.current.setActivityFilterHours('custom', undefined);
	});
	expect(stored()).toEqual({ Channels: 720 });
});

it('shows a change to every component reading the filters', () => {
	const { result: writer } = renderHook(() => useActivityFilter());
	const { result: reader } = renderHook(() => useActivityFilter());

	act(() => {
		writer.current.setActivityFilterHours('Channels', 168);
	});

	expect(reader.current.getActivityFilterHours('Channels')).toBe(168);
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
