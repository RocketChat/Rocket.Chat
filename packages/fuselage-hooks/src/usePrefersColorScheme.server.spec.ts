import { renderHook } from './testing';
import { usePrefersColorScheme } from './usePrefersColorScheme';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersColorScheme());

	expect(result.current).toBe(false);
});
