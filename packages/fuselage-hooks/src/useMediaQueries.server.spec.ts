import { renderHook } from './testing.js';
import { useMediaQueries } from './useMediaQueries.js';

it('returns empty array for undefined media query', () => {
	const { result } = renderHook(() => useMediaQueries());

	expect(result.current).toStrictEqual([]);
});

it('returns false for defined media query', () => {
	const { result } = renderHook(() => useMediaQueries('(max-width: 1024)'));

	expect(result.current).toEqual([false]);
});
