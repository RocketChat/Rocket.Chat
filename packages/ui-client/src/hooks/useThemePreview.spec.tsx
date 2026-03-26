import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useThemeMode } from './useThemeMode';
import { useThemePreview } from './useThemePreview';
import { ThemePreviewProvider } from '../providers/ThemePreviewProvider';

jest.mock('./useThemeMode');
jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDarkMode: jest.fn(),
}));

const mockUseThemeMode = useThemeMode as jest.MockedFunction<typeof useThemeMode>;
const mockUseDarkMode = useDarkMode as jest.MockedFunction<typeof useDarkMode>;

describe('useThemePreview Hook', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseThemeMode.mockReturnValue(['light', jest.fn(), 'light']);
		mockUseDarkMode.mockReturnValue(false);
	});

	it('should return default state when outside context', () => {
		const { result } = renderHook(() => useThemePreview());

		expect(result.current.previewTheme).toBeUndefined();
		expect(result.current.resolvedPreviewTheme).toBe('light');
	});

	it('should return NOOP functions when outside context', () => {
		const { result } = renderHook(() => useThemePreview());

		act(() => {
			result.current.setPreviewTheme('dark');
			result.current.clearPreviewTheme();
		});

		expect(result.current.previewTheme).toBeUndefined();
	});

	it('should resolve light theme when isDarkMode is false', () => {
		mockUseDarkMode.mockReturnValue(false);
		const wrapper = ({ children }: { children: ReactNode }) => <ThemePreviewProvider>{children}</ThemePreviewProvider>;

		const { result } = renderHook(() => useThemePreview(), { wrapper });

		expect(result.current.resolvedPreviewTheme).toBe('light');
	});

	it('should resolve dark theme when isDarkMode is true', () => {
		mockUseDarkMode.mockReturnValue(true);
		const wrapper = ({ children }: { children: ReactNode }) => <ThemePreviewProvider>{children}</ThemePreviewProvider>;

		const { result } = renderHook(() => useThemePreview(), { wrapper });

		expect(result.current.resolvedPreviewTheme).toBe('dark');
	});

	it('should use preview theme when available', () => {
		const wrapper = ({ children }: { children: ReactNode }) => <ThemePreviewProvider>{children}</ThemePreviewProvider>;

		const { result } = renderHook(() => useThemePreview(), { wrapper });

		expect(result.current.previewTheme).toBeUndefined();

		act(() => {
			result.current.setPreviewTheme('dark');
		});

		expect(result.current.previewTheme).toBe('dark');
	});
});
