import { renderHook } from './testing';
import { useLazyRef } from './useLazyRef';

it('returns the computed value immediately', () => {
	const computedValue = Symbol('computed');

	const { result } = renderHook(() => useLazyRef(() => computedValue));

	expect(result.current.current).toBe(computedValue);
});

it('runs the initializer once', () => {
	const initializer = jest.fn();

	const { rerender } = renderHook(() => {
		useLazyRef(initializer);
	});
	rerender();

	expect(initializer).toHaveBeenCalledTimes(1);
});
