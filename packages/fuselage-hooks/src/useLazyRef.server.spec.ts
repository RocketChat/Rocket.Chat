import { renderHook } from './testing.js';
import { useLazyRef } from './useLazyRef.js';

it('returns the computed value immediately', () => {
	const computedValue = Symbol('computed');

	const { result } = renderHook(() => useLazyRef(() => computedValue));

	expect(result.current.current).toBe(computedValue);
});
