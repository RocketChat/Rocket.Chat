import { useReducer } from 'react';

import { renderHook, act } from './testing';
import { usePrevious } from './usePrevious';

it('returns previous values', () => {
	const { result } = renderHook(() => {
		const [current, next] = useReducer((current) => current + 1, 0);
		const previous = usePrevious(current);

		return { current, previous, next };
	});

	expect(result.current.current).toBe(0);
	expect(result.current.previous).toBe(undefined);

	act(() => {
		result.current.next();
	});

	expect(result.current.current).toBe(1);
	expect(result.current.previous).toBe(0);

	act(() => {
		result.current.next();
	});

	expect(result.current.current).toBe(2);
	expect(result.current.previous).toBe(1);
});
