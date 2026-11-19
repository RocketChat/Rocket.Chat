import { act, renderHook } from '@testing-library/react';

import { setThemePreview, useThemePreview } from './useThemePreview';

afterEach(() => {
	act(() => setThemePreview(undefined));
});

it('has no preview by default', () => {
	const { result } = renderHook(() => useThemePreview());
	expect(result.current).toBeUndefined();
});

it('exposes and clears the preview', () => {
	const { result } = renderHook(() => useThemePreview());
	act(() => setThemePreview('dark'));
	expect(result.current).toBe('dark');
	act(() => setThemePreview(undefined));
	expect(result.current).toBeUndefined();
});
