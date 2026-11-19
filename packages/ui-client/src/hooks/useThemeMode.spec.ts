import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useThemeMode } from './useThemeMode';
import { setThemePreview } from './useThemePreview';

const mockUseDarkMode = jest.fn();
jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDarkMode: (isDark?: boolean) => mockUseDarkMode(isDark),
}));

afterEach(() => {
	mockUseDarkMode.mockReset();
	setThemePreview(undefined);
});

describe('useThemeMode', () => {
	it('should resolve to "light" when mode is "auto" and system prefers light', () => {
		mockUseDarkMode.mockReturnValue(false);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'auto').build(),
		});

		expect(result.current).toBe('light');
		expect(mockUseDarkMode).toHaveBeenCalledWith(undefined);
	});

	it('should resolve to "dark" when mode is "auto" and system prefers dark', () => {
		mockUseDarkMode.mockReturnValue(true);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'auto').build(),
		});

		expect(result.current).toBe('dark');
		expect(mockUseDarkMode).toHaveBeenCalledWith(undefined);
	});

	it('should resolve to "dark" when mode is "dark"', () => {
		mockUseDarkMode.mockReturnValue(true);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
		});

		expect(result.current).toBe('dark');
		expect(mockUseDarkMode).toHaveBeenCalledWith(true);
	});

	it('should resolve to "light" when mode is "light"', () => {
		mockUseDarkMode.mockReturnValue(false);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
		});

		expect(result.current).toBe('light');
		expect(mockUseDarkMode).toHaveBeenCalledWith(false);
	});

	it('should resolve to "high-contrast" when mode is "high-contrast"', () => {
		mockUseDarkMode.mockReturnValue(false);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'high-contrast').build(),
		});

		expect(result.current).toBe('high-contrast');
	});

	it('should use the preview theme instead of the saved preference', () => {
		mockUseDarkMode.mockReturnValue(true);
		setThemePreview('dark');

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
		});

		expect(result.current).toBe('dark');
		expect(mockUseDarkMode).toHaveBeenCalledWith(true);
	});

	it('should use the saved preference when no preview exists', () => {
		mockUseDarkMode.mockReturnValue(false);
		setThemePreview(undefined);

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
		});

		expect(result.current).toBe('light');
		expect(mockUseDarkMode).toHaveBeenCalledWith(false);
	});

	it('should pass undefined to useDarkMode when preview is auto', () => {
		mockUseDarkMode.mockReturnValue(false);
		setThemePreview('auto');

		const { result } = renderHook(() => useThemeMode(), {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
		});

		expect(result.current).toBe('light');
		expect(mockUseDarkMode).toHaveBeenCalledWith(undefined);
	});
});
