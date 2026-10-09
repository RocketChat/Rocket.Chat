import type { Dispatch, DispatchWithoutAction } from 'react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook that wraps pairs of state and dispatcher to provide a new dispatcher
 * which can be safe and asynchronically called even after the component unmounted.
 *
 * @param pair - the state and dispatcher pair which will be patched
 * @returns a state value and safe dispatcher pair
 * @public
 */
export function useSafely<S, D extends DispatchWithoutAction | Dispatch<any>>([state, dispatcher]: [state: S, dispatch: D]): [
	state: S,
	dispatch: D,
];

export function useSafely([state, dispatcher]: [state: unknown, dispatch: (action?: unknown) => void]) {
	const dispatcherRef = useRef<((action?: unknown) => void) | undefined>(dispatcher);

	useEffect(() => {
		dispatcherRef.current = dispatcher;
		return () => {
			dispatcherRef.current = undefined;
		};
	}, [dispatcher]);

	const safeDispatcher = useCallback((action?: unknown) => {
		const dispatcher = dispatcherRef.current;
		dispatcher?.(action);
	}, []);

	return [state, safeDispatcher];
}
