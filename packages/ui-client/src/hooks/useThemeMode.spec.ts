import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act } from '@testing-library/react';

import { useThemeMode } from './useThemeMode';

const mockUseDarkMode = jest.fn();

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDarkMode: (...args: unknown[]) => mockUseDarkMode(...args),
}));

afterEach(() => {
	mockUseDarkMode.mockReset();
});

describe('useThemeMode', () => {
	describe('current theme mode', () => {
		it('should default to "auto" when no preference is set', () => {
			mockUseDarkMode.mockReturnValue(false);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().build(),
			});

			expect(result.current[0]).toBe('auto');
		});

		it('should return the user preference when set', () => {
			mockUseDarkMode.mockReturnValue(true);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
			});

			expect(result.current[0]).toBe('dark');
		});
	});

	describe('resolved theme', () => {
		it('should resolve to "light" when mode is "auto" and system prefers light', () => {
			mockUseDarkMode.mockReturnValue(false);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'auto').build(),
			});

			expect(result.current[2]).toBe('light');
			expect(mockUseDarkMode).toHaveBeenCalledWith(undefined);
		});

		it('should resolve to "dark" when mode is "auto" and system prefers dark', () => {
			mockUseDarkMode.mockReturnValue(true);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'auto').build(),
			});

			expect(result.current[2]).toBe('dark');
			expect(mockUseDarkMode).toHaveBeenCalledWith(undefined);
		});

		it('should resolve to "dark" when mode is "dark"', () => {
			mockUseDarkMode.mockReturnValue(true);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
			});

			expect(result.current[2]).toBe('dark');
			expect(mockUseDarkMode).toHaveBeenCalledWith(true);
		});

		it('should resolve to "light" when mode is "light"', () => {
			mockUseDarkMode.mockReturnValue(false);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
			});

			expect(result.current[2]).toBe('light');
			expect(mockUseDarkMode).toHaveBeenCalledWith(false);
		});

		it('should resolve to "high-contrast" when mode is "high-contrast"', () => {
			mockUseDarkMode.mockReturnValue(false);

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'high-contrast').build(),
			});

			expect(result.current[2]).toBe('high-contrast');
		});
	});

	describe('setThemeMode', () => {
		it('should return a function that calls the endpoint for each theme mode', async () => {
			mockUseDarkMode.mockReturnValue(false);
			const endpointHandler = jest.fn();

			const { result } = renderHook(() => useThemeMode(), {
				wrapper: mockAppRoot().withEndpoint('POST', '/v1/users.setPreferences', endpointHandler).build(),
			});

			const setTheme = result.current[1];

			await act(async () => {
				setTheme('dark')();
			});
			expect(endpointHandler).toHaveBeenCalledWith({ data: { themeAppearence: 'dark' } });

			endpointHandler.mockClear();

			await act(async () => {
				setTheme('light')();
			});
			expect(endpointHandler).toHaveBeenCalledWith({ data: { themeAppearence: 'light' } });

			endpointHandler.mockClear();

			await act(async () => {
				setTheme('auto')();
			});
			expect(endpointHandler).toHaveBeenCalledWith({ data: { themeAppearence: 'auto' } });

			endpointHandler.mockClear();

			await act(async () => {
				setTheme('high-contrast')();
			});
			expect(endpointHandler).toHaveBeenCalledWith({ data: { themeAppearence: 'high-contrast' } });
		});
	});
});
