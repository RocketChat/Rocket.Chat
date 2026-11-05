import { useIsEnterprise } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import {
	isActivityFilterable,
	useActivityFilterClock,
	useActivityFilterHours,
	useSetActivityFilterHidesUnreads,
	useSetActivityFilterHours,
} from './useActivityFilter';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserId: jest.fn(),
}));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useIsEnterprise: jest.fn(),
}));

const mockedUseIsEnterprise = jest.mocked(useIsEnterprise);
const mockedUseUserId = jest.mocked(useUserId);

// UI-PREVIEW ONLY: the filters live in localStorage, under the key fuselage-hooks derives.
const STORAGE_KEY = 'fuselage-localStorage-sidebarActivityFilters-user-1';
const HIDES_UNREADS_KEY = 'fuselage-localStorage-sidebarActivityFilterHidesUnreads-user-1';

const stored = (): Record<string, number> => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const withStored = (filters: Record<string, number>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
const storedHidesUnreads = (): Record<string, boolean> => JSON.parse(localStorage.getItem(HIDES_UNREADS_KEY) ?? '{}');
const withStoredHidesUnreads = (toggles: Record<string, boolean>) => localStorage.setItem(HIDES_UNREADS_KEY, JSON.stringify(toggles));

beforeEach(() => {
	localStorage.clear();
	mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: true } } as any);
	mockedUseUserId.mockReturnValue('user-1');
});

describe('useActivityFilterHours', () => {
	it('reads the filter stored for the group', () => {
		withStored({ Channels: 168 });

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Channels')).toBe(168);
		expect(result.current.getActivityFilterHours('Direct_Messages')).toBeUndefined();
		expect(result.current.hasActivityFilters).toBe(true);
	});

	it('reads no filter without the license module', () => {
		withStored({ Channels: 168 });
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: false } } as any);

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Channels')).toBeUndefined();
		expect(result.current.hasActivityFilters).toBe(false);
	});

	it('reads no filter for a dynamic group, whatever is stored', () => {
		withStored({ Unread: 24 });
		withStoredHidesUnreads({ Unread: true });

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHours('Unread')).toBeUndefined();
		expect(result.current.getActivityFilterHidesUnreads('Unread')).toBe(false);
		expect(result.current.hasActivityFilters).toBe(false);
	});

	it('reads whether the filter hides the unread rooms too, even while it has no window', () => {
		withStored({ custom: 24 });
		withStoredHidesUnreads({ Channels: true });

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHidesUnreads('Channels')).toBe(true);
		expect(result.current.getActivityFilterHidesUnreads('custom')).toBe(false);
	});

	it('reads no unreads toggle without the license module', () => {
		withStoredHidesUnreads({ Channels: true });
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: false } } as any);

		const { result } = renderHook(() => useActivityFilterHours());

		expect(result.current.getActivityFilterHidesUnreads('Channels')).toBe(false);
	});
});

describe('useSetActivityFilterHidesUnreads', () => {
	it('stores the toggle for the group, keeping the others and the windows', () => {
		withStored({ Channels: 168 });
		withStoredHidesUnreads({ custom: true });

		const { result } = renderHook(() => useSetActivityFilterHidesUnreads());

		act(() => result.current('Channels', true));

		expect(storedHidesUnreads()).toEqual({ custom: true, Channels: true });
		expect(stored()).toEqual({ Channels: 168 });
	});

	it('drops the toggle when turned off', () => {
		withStoredHidesUnreads({ custom: true, Channels: true });

		const { result } = renderHook(() => useSetActivityFilterHidesUnreads());

		act(() => result.current('Channels', false));

		expect(storedHidesUnreads()).toEqual({ custom: true });
	});
});

describe('isActivityFilterable', () => {
	it('excludes every dynamic group and nothing else', () => {
		SIDEBAR_DYNAMIC_GROUP_KEYS.forEach((key) => expect(isActivityFilterable(key)).toBe(false));
		expect(isActivityFilterable('Channels')).toBe(true);
		expect(isActivityFilterable('custom')).toBe(true);
	});
});

describe('useSetActivityFilterHours', () => {
	it('stores the filter for the group, keeping the others', () => {
		withStored({ Channels: 168 });

		const { result } = renderHook(() => useSetActivityFilterHours());

		act(() => result.current('custom', 24));

		expect(stored()).toEqual({ Channels: 168, custom: 24 });
	});

	it('clears the filter', () => {
		withStored({ Channels: 168, custom: 24 });

		const { result } = renderHook(() => useSetActivityFilterHours());

		act(() => result.current('custom', undefined));

		expect(stored()).toEqual({ Channels: 168 });
	});
});

describe('useActivityFilterClock', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('ticks every five minutes only while enabled', () => {
		const { result, rerender } = renderHook(({ enabled }) => useActivityFilterClock(enabled), { initialProps: { enabled: false } });
		const start = result.current;

		act(() => jest.advanceTimersByTime(5 * 60 * 1000));
		expect(result.current).toBe(start);

		rerender({ enabled: true });
		act(() => jest.advanceTimersByTime(5 * 60 * 1000));
		expect(result.current).toBeGreaterThan(start);
	});
});
