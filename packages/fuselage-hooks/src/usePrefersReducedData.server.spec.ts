import { renderHook } from './testing.js';
import { usePrefersReducedData } from './usePrefersReducedData.js';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedData());

	expect(result.current).toBe(false);
});
