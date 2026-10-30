import { renderHook } from './testing.js';
import { useStableCallback } from './useStableCallback.js';

it('returns a callback that invokes the mutable one', () => {
	const fn = jest.fn();

	const { result } = renderHook(() => useStableCallback(fn));

	result.current();

	expect(fn).toHaveBeenCalledTimes(1);
});
