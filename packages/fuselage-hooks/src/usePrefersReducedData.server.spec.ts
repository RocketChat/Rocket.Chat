import { renderHook } from './testing';
import { usePrefersReducedData } from './usePrefersReducedData';

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedData());

	expect(result.current).toBe(false);
});
