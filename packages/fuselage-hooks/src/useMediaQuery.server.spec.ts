import { renderHook } from './testing';
import { useMediaQuery } from './useMediaQuery';

it('returns false for undefined media query', () => {
	const { result } = renderHook(() => useMediaQuery());

	expect(result.current).toBe(false);
});

it('returns false for defined media query', () => {
	const { result } = renderHook(() => useMediaQuery('(max-width: 1024)'));

	expect(result.current).toBe(false);
});
