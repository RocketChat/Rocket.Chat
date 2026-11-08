import { renderHook } from './testing';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedMotion());

	expect(result.current).toBe(false);
});
