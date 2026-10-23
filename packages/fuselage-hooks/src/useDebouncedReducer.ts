import type { Dispatch, DispatchWithoutAction, Reducer, ReducerState, ReducerWithoutAction } from 'react';
import { useReducer } from 'react';

import { useDebouncedUpdates } from './useDebouncedUpdates';

/**
 * Hook to create a reduced state with a debounced `dispatch()` function.
 *
 * @param reducer - the reducer function
 * @param initialArg - the initial state value or the argument passed to the
 *        initial state generator function
 * @param init - the initial state generator function
 * @param delay - the number of milliseconds to delay the updater
 * @returns a state and debounced `dispatch()` function
 * @public
 */
export function useDebouncedReducer<S, R extends ReducerWithoutAction<S>>(
	reducer: R,
	initialArg: S,
	init: undefined,
	delay: number,
): [
	ReducerState<R>,
	DispatchWithoutAction & {
		flush: () => void;
		cancel: () => void;
	},
];

/**
 * Hook to create a reduced state with a debounced `dispatch()` function.
 *
 * @param reducer - the reducer function
 * @param initialArg - the initial state value or the argument passed to the
 *        initial state generator function
 * @param init - the initial state generator function
 * @param delay - the number of milliseconds to delay the updater
 * @returns a state and debounced `dispatch()` function
 * @public
 */
export function useDebouncedReducer<S, R extends ReducerWithoutAction<S>, I>(
	reducer: R,
	initialArg: I,
	init: (arg: I) => ReducerState<R>,
	delay: number,
): [
	ReducerState<R>,
	DispatchWithoutAction & {
		flush: () => void;
		cancel: () => void;
	},
];

// /**
//  * Hook to create a reduced state with a debounced `dispatch()` function.
//  *
//  * @param reducer - the reducer function
//  * @param initialArg - the initial state value or the argument passed to the
//  *        initial state generator function
//  * @param init - the initial state generator function
//  * @param delay - the number of milliseconds to delay the updater
//  * @returns a state and debounced `dispatch()` function
//  * @public
//  */
// export function useDebouncedReducer<S, A, R extends Reducer<S, A>>(
//   reducer: R,
//   initialArg: S,
//   init: undefined,
//   delay: number
// ): [
//   ReducerState<R>,
//   Dispatch<A> & {
//     flush: () => void;
//     cancel: () => void;
//   }
// ];

/**
 * Hook to create a reduced state with a debounced `dispatch()` function.
 *
 * @param reducer - the reducer function
 * @param initialArg - the initial state value or the argument passed to the
 *        initial state generator function
 * @param init - the initial state generator function
 * @param delay - the number of milliseconds to delay the updater
 * @returns a state and debounced `dispatch()` function
 * @public
 */
export function useDebouncedReducer<S, A, R extends Reducer<S, A>, I>(
	reducer: R,
	initialArg: I,
	init: (arg: I) => ReducerState<R>,
	delay: number,
): [
	ReducerState<R>,
	Dispatch<A> & {
		flush: () => void;
		cancel: () => void;
	},
];

export function useDebouncedReducer(
	reducer: (prevState: unknown, action?: unknown) => unknown,
	initialArg: unknown,
	init: ((arg?: unknown) => unknown) | undefined,
	delay: number,
) {
	return useDebouncedUpdates(
		init !== undefined
			? // eslint-disable-next-line react-hooks/rules-of-hooks
				useReducer(reducer, initialArg, init)
			: // eslint-disable-next-line react-hooks/rules-of-hooks
				useReducer(reducer, initialArg),
		delay,
	);
}
