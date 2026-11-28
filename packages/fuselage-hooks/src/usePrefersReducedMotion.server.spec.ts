import { renderHook } from './testing.js';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedMotion());

	expect(result.current).toBe(false);
});
