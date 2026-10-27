import type { Dispatch, DispatchWithoutAction } from 'react';

import { useDebouncedCallback } from './useDebouncedCallback';

/**
 * Hook to debounce the state dispatcher function returned by hooks like `useState()` and `useReducer()`.
 *
 * @param pair the state value and dispatcher function pair
 * @param delay the number of milliseconds to delay the dispatcher
 * @returns a state value and debounced dispatcher pair
 * @public
 */
export function useDebouncedUpdates<S>(
	pair: [state: S, dispatch: DispatchWithoutAction],
	delay: number,
): [
	S,
	DispatchWithoutAction & {
		flush: () => void;
		cancel: () => void;
	},
];

/**
 * Hook to debounce the state dispatcher function returned by hooks like `useState()` and `useReducer()`.
 *
 * @param pair the state value and dispatcher function pair
 * @param delay the number of milliseconds to delay the dispatcher
 * @returns a state value and debounced dispatcher pair
 * @public
 */
export function useDebouncedUpdates<S, A>(
	pair: [state: S, dispatch: Dispatch<A>],
	delay: number,
): [
	S,
	Dispatch<A> & {
		flush: () => void;
		cancel: () => void;
	},
];

export function useDebouncedUpdates([state, dispatch]: [state: unknown, dispatch: (action?: unknown) => void], delay: number) {
	return [state, useDebouncedCallback(dispatch, delay, [])];
}
