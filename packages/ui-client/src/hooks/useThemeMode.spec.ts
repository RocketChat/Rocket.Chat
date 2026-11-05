import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useThemeMode } from './useThemeMode.js';
import { useThemePreview } from './useThemePreview.js';

const mockUseDarkMode = jest.fn();

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDarkMode: (...args: unknown[]) => mockUseDarkMode(...args),
}));

afterEach(() => {
	mockUseDarkMode.mockReset();
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

	it('should resolve to the previewed preference while a preview is mounted', () => {
		mockUseDarkMode.mockImplementation((forced?: boolean) => forced ?? false);

		const { result, rerender, unmount } = renderHook(
			({ preview }: { preview?: 'dark' | 'high-contrast' }) => {
				useThemePreview(preview);
				return useThemeMode();
			},
			{
				initialProps: { preview: 'dark' as 'dark' | 'high-contrast' | undefined },
				wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
			},
		);

		expect(result.current).toBe('dark');

		rerender({ preview: 'high-contrast' });
		expect(result.current).toBe('high-contrast');

		rerender({ preview: undefined });
		expect(result.current).toBe('light');

		unmount();
	});

	it('should fall back to the saved preference once the preview unmounts', () => {
		mockUseDarkMode.mockImplementation((forced?: boolean) => forced ?? false);
		const wrapper = mockAppRoot().withUserPreference('themeAppearence', 'light').build();

		const { unmount: unmountPreview } = renderHook(() => useThemePreview('dark'), { wrapper });
		const { result } = renderHook(() => useThemeMode(), { wrapper });

		expect(result.current).toBe('dark');

		unmountPreview();
		expect(result.current).toBe('light');
	});
});
