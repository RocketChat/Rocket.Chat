import { renderHook } from './testing.js';
import { useSafely } from './useSafely.js';

it('returns the initial state', () => {
	const initialState = Symbol();
	const dispatcher = jest.fn();

	const { result } = renderHook(() => useSafely([initialState, dispatcher]));
	const [state] = result.current;

	expect(state).toBe(initialState);
});
