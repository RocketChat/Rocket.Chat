import { renderHook } from './testing';
import { usePrefersColorScheme } from './usePrefersColorScheme';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock';

const setViewport = withMatchMediaMock();

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersColorScheme());

	expect(result.current).toBe(false);
});

it('should return true with matchMedia mocked and anything set', () => {
	setViewport({
		'prefers-color-scheme': 'light',
	});

	const { result } = renderHook(() => usePrefersColorScheme());

	expect(result.current).toBe(true);
});

it('should return true with matchMedia mocked and light scheme set', () => {
	setViewport({
		'prefers-color-scheme': 'light',
	});

	const { result } = renderHook(() => usePrefersColorScheme('light'));

	expect(result.current).toBe(true);
});

it('should return true with matchMedia mocked and dark scheme set', () => {
	setViewport({
		'prefers-color-scheme': 'dark',
	});

	const { result } = renderHook(() => usePrefersColorScheme('dark'));

	expect(result.current).toBe(true);
});
