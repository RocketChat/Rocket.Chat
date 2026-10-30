import { renderHook } from './testing.js';
import { useDebouncedValue } from './useDebouncedValue.js';

const delay = 100;

beforeEach(() => {
	jest.useFakeTimers();
});

it('returns the initial value', () => {
	const initialValue = Symbol();

	const { result } = renderHook(() => useDebouncedValue(initialValue, delay));

	expect(result.current).toBe(initialValue);
});
