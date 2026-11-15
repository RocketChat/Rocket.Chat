import { useState } from 'react';

import { renderHook, act } from './testing';
import { useDebouncedUpdates } from './useDebouncedUpdates';

beforeAll(() => {
	jest.useFakeTimers();
});

const delay = 100;

it('returns a debounced state dispatcher', () => {
	const initialState = Symbol('initial');
	const newState = Symbol('new');

	const { result } = renderHook(() => useDebouncedUpdates(useState<symbol>(initialState), delay));

	const [, dispatch] = result.current;

	expect(dispatch).toBeInstanceOf(Function);
	expect(dispatch.flush).toBeInstanceOf(Function);
	expect(dispatch.cancel).toBeInstanceOf(Function);

	act(() => {
		const [, setState] = result.current;
		setState(newState);
	});

	expect(result.current[0]).toBe(initialState);

	act(() => {
		jest.advanceTimersByTime(delay);
	});

	expect(result.current[0]).toBe(newState);
});
