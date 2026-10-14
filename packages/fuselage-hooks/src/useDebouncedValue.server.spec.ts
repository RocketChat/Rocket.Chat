import { renderHook } from './testing';
import { useDebouncedValue } from './useDebouncedValue';

const delay = 100;

beforeEach(() => {
	jest.useFakeTimers();
});

it('returns the initial value', () => {
	const initialValue = Symbol();

	const { result } = renderHook(() => useDebouncedValue(initialValue, delay));

	expect(result.current).toBe(initialValue);
});
