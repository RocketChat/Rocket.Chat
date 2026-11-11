import { useReducer } from 'react';

import { renderHook, act } from './testing';
import { useDebouncedValue } from './useDebouncedValue';

beforeAll(() => {
	jest.useFakeTimers();
});

const delay = 100;

it('returns the initial value', () => {
	const initialValue = Symbol();

	const { result } = renderHook(() => useDebouncedValue(initialValue, delay));

	expect(result.current).toBe(initialValue);
});

it('returns the newest value after timeout', () => {
	const { result } = renderHook(() => {
		const [current, next] = useReducer((current) => current + 1, 0);
		const debounced = useDebouncedValue(current, delay);

		return { debounced, next };
	});

	expect(result.current.debounced).toBe(0);

	act(() => {
		const { next } = result.current;
		next();
	});

	expect(result.current.debounced).toBe(0);

	act(() => {
		jest.advanceTimersByTime(delay);
	});

	expect(result.current.debounced).toBe(1);
});
