import { useState } from 'react';

import { renderHook, act } from './testing';
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

it("returns the same callback if deps don't change", () => {
	const delay = 100;
	const { result, rerender } = renderHook(() => useDebouncedCallback(() => undefined, delay, []));

	const initialCallback = result.current;

	rerender();

	expect(result.current).toBe(initialCallback);
});

it('returns another callback if deps change', () => {
	const delay = 100;
	const initialDep = Symbol('initial');
	const newDep = Symbol('new');

	const { result } = renderHook(() => {
		const [dep, setDep] = useState<symbol>(initialDep);
		const debouncedCallback = useDebouncedCallback(() => undefined, delay, [dep]);

		return { setDep, debouncedCallback };
	});

	const initialCallback = result.current.debouncedCallback;

	act(() => {
		const { setDep } = result.current;
		setDep(newDep);
	});

	expect(result.current.debouncedCallback).not.toBe(initialCallback);
});

it('returns another callback if delay change', () => {
	const initialDelay = 100;
	const newDelay = 150;

	const { result } = renderHook(() => {
		const [delay, setDelay] = useState(initialDelay);
		const debouncedCallback = useDebouncedCallback(() => undefined, delay, []);

		return { setDelay, debouncedCallback };
	});

	const initialCallback = result.current.debouncedCallback;

	act(() => {
		const { setDelay } = result.current;
		setDelay(newDelay);
	});

	expect(result.current.debouncedCallback).not.toBe(initialCallback);
});

it('flushes a pending call only once', () => {
	const fn = jest.fn();
	const { result } = renderHook(() => useDebouncedCallback(fn, 100));

	result.current('latest');
	result.current.flush();
	result.current.flush();
	jest.advanceTimersByTime(100);

	expect(fn).toHaveBeenCalledTimes(1);
	expect(fn).toHaveBeenCalledWith('latest');
});

it('does not flush a call that already ran', () => {
	const fn = jest.fn();
	const { result } = renderHook(() => useDebouncedCallback(fn, 100));

	result.current();
	jest.advanceTimersByTime(100);
	result.current.flush();

	expect(fn).toHaveBeenCalledTimes(1);
});

it('does not flush a cancelled call', () => {
	const fn = jest.fn();
	const { result } = renderHook(() => useDebouncedCallback(fn, 100));

	result.current();
	result.current.cancel();
	result.current.flush();
	jest.advanceTimersByTime(100);

	expect(fn).not.toHaveBeenCalled();
});

it('preserves a new call scheduled while flushing the previous one', () => {
	const fn = jest.fn<void, [string]>((value) => {
		if (value === 'first') result.current('second');
	});
	const { result } = renderHook(() => useDebouncedCallback(fn, 100));

	result.current('first');
	result.current.flush();
	jest.advanceTimersByTime(100);
	result.current.flush();

	expect(fn.mock.calls).toEqual([['first'], ['second']]);
});

it('discards pending work on unmount', () => {
	const fn = jest.fn();
	const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 100));
	const debounced = result.current;
	debounced();
	unmount();
	debounced.flush();
	jest.advanceTimersByTime(100);

	expect(fn).not.toHaveBeenCalled();
});
