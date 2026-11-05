import { renderHook } from './testing';
import { useStableCallback } from './useStableCallback';

it('returns a callback that invokes the mutable one', () => {
	const fn = jest.fn();

	const { result } = renderHook(() => useStableCallback(fn));

	result.current();

	expect(fn).toHaveBeenCalledTimes(1);
});
