import { renderHook, act } from './testing';
import { useDebouncedReducer } from './useDebouncedReducer';

beforeAll(() => {
	jest.useFakeTimers();
});

const delay = 100;

it('is a debounced state updater', () => {
	const initialState = Symbol('initial');
	const newState = Symbol('new');
	const reducer = jest.fn(() => newState);
	const initialArg = initialState;
	const init = jest.fn((state) => state);

	const { result } = renderHook(() => useDebouncedReducer(reducer, initialArg, init, delay));

	expect(result.current[0]).toBe(initialState);

	act(() => {
		const [, dispatch] = result.current;
		dispatch();
	});

	expect(result.current[0]).toBe(initialState);

	act(() => {
		jest.advanceTimersByTime(delay);
	});

	expect(reducer).toHaveBeenCalledWith(initialState, undefined);
	expect(init).toHaveBeenCalledWith(initialArg);

	expect(result.current[0]).toBe(newState);
});
