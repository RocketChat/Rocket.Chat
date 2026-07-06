import { act, renderHook } from '@testing-library/react';

import { useReactiveTimeFromNow } from './useReactiveTimeFromNow';

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('should return undefined when date is undefined', () => {
	const { result } = renderHook(() => useReactiveTimeFromNow(undefined));

	expect(result.current).toBeUndefined();
});

it('should return undefined for an invalid date instead of throwing', () => {
	const { result } = renderHook(() => useReactiveTimeFromNow('not-a-real-date'));

	expect(result.current).toBeUndefined();
});

it('should format the initial relative time immediately', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const thirtySecondsAgo = new Date(now.getTime() - 30000);

	const { result } = renderHook(() => useReactiveTimeFromNow(thirtySecondsAgo));

	expect(result.current).toBe('1 minute ago');
});

it('should refresh the displayed text as time passes without changing props', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const thirtySecondsAgo = new Date(now.getTime() - 30000);

	const { result } = renderHook(() => useReactiveTimeFromNow(thirtySecondsAgo));

	expect(result.current).toBe('1 minute ago');

	act(() => {
		jest.advanceTimersByTime(120000);
	});

	expect(result.current).toBe('3 minutes ago');
});

it('should omit the suffix when withSuffix is false', () => {
	const now = new Date('2026-05-12T12:00:00.000Z');
	jest.setSystemTime(now);

	const fiveMinutesAgo = new Date(now.getTime() - 300000);

	const { result } = renderHook(() => useReactiveTimeFromNow(fiveMinutesAgo, false));

	expect(result.current).toBe('5 minutes');
});
