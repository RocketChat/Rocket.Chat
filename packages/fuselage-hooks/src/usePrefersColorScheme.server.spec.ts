import { renderHook } from './testing.js';
import { usePrefersColorScheme } from './usePrefersColorScheme.js';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersColorScheme());

	expect(result.current).toBe(false);
});
