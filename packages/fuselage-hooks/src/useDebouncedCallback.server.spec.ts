import { renderHook } from './testing';
import { useDebouncedCallback } from './useDebouncedCallback';

beforeAll(() => {
	jest.useFakeTimers();
});

it('returns a debounced callback', () => {
	const halfDelay = 50;
	const delay = 2 * halfDelay;
	const fn = jest.fn();

	const { result } = renderHook(() => useDebouncedCallback(fn, delay));

	const debouncedCallback = result.current;
	expect(debouncedCallback).toBeInstanceOf(Function);
	expect(debouncedCallback.flush).toBeInstanceOf(Function);
	expect(debouncedCallback.cancel).toBeInstanceOf(Function);

	debouncedCallback();

	jest.advanceTimersByTime(halfDelay);

	expect(fn).toHaveBeenCalledTimes(0);

	jest.advanceTimersByTime(halfDelay);

	expect(fn).toHaveBeenCalledTimes(1);
});
