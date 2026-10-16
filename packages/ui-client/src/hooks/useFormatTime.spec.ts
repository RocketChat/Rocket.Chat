import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import * as dateFormat from '../lib/dateFormat';
import { useFormatTime } from './useFormatTime';

describe('useFormatTime', () => {
	const testDate = new Date('2026-01-15T19:00:00.000Z');
	let formatDateSpy: jest.SpyInstance;

	beforeEach(() => {
		formatDateSpy = jest.spyOn(dateFormat, 'formatDate');
	});

	afterEach(() => {
		formatDateSpy.mockRestore();
	});

	it('formats with undefined timezone when no user preference or override is provided', () => {
		const { result } = renderHook(() => useFormatTime(), {
			wrapper: mockAppRoot().withSetting('Message_TimeFormat', 'LT').build(),
		});

		result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'LT', undefined, undefined);
	});

	it('uses the configured timezone from user preference', () => {
		const { result } = renderHook(() => useFormatTime(), {
			wrapper: mockAppRoot()
				.withUserPreference('timezone', 'America/Vancouver')
				.withUserPreference('clockMode', 2)
				.build(),
		});

		const formatted = result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'H:mm', undefined, 'America/Vancouver');
		expect(formatted).toBe('11:00');
	});

	it('maps user preference "local" to undefined timezone', () => {
		const { result } = renderHook(() => useFormatTime(), {
			wrapper: mockAppRoot()
				.withUserPreference('timezone', 'local')
				.withSetting('Message_TimeFormat', 'LT')
				.build(),
		});

		result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'LT', undefined, undefined);
	});

	it('prioritizes timezoneOverride over user preference', () => {
		const { result } = renderHook(() => useFormatTime('none'), {
			wrapper: mockAppRoot()
				.withUserPreference('timezone', 'America/New_York')
				.withUserPreference('clockMode', 2)
				.build(),
		});

		result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'H:mm', undefined, 'none');
	});

	it('prioritizes timezoneOverride when setting an explicit timezone', () => {
		const { result } = renderHook(() => useFormatTime('UTC'), {
			wrapper: mockAppRoot()
				.withUserPreference('timezone', 'America/Vancouver')
				.withUserPreference('clockMode', 2)
				.build(),
		});

		const formatted = result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'H:mm', undefined, 'UTC');
		expect(formatted).toBe('19:00');
	});

	it('prioritizes callback tz parameter over timezoneOverride and user preference', () => {
		const { result } = renderHook(() => useFormatTime('America/Vancouver'), {
			wrapper: mockAppRoot()
				.withUserPreference('timezone', 'America/New_York')
				.withUserPreference('clockMode', 2)
				.build(),
		});

		const formatted = result.current(testDate, 'UTC');
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'H:mm', undefined, 'UTC');
		expect(formatted).toBe('19:00');
	});

	it('respects 12-hour clock mode (clockMode: 1)', () => {
		const { result } = renderHook(() => useFormatTime(), {
			wrapper: mockAppRoot()
				.withUserPreference('clockMode', 1)
				.withUserPreference('timezone', 'America/Vancouver')
				.build(),
		});

		const formatted = result.current(testDate);
		expect(formatDateSpy).toHaveBeenCalledWith(testDate, 'h:mm A', undefined, 'America/Vancouver');
		expect(formatted).toBe('11:00 AM');
	});
});
