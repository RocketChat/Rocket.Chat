import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo, useState } from 'react';

import { AsyncStatePhase, AsyncState, asyncState } from '../lib/asyncState';

type AsyncStateObject<T> = AsyncState<T> & {
	resolve: (value: T | ((prev: T | undefined) => T)) => void;
	reject: (error: Error) => void;
	reset: () => void;
	update: () => void;
};

export const useAsyncState = <T>(initialValue?: T | (() => T)): AsyncStateObject<T> => {
	const [state, setState] = useSafely(
		useState<AsyncState<T>>(() => {
			if (typeof initialValue === 'undefined') {
				return asyncState.loading<T>();
			}

			return asyncState.resolved<T>(typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
		}),
	);

	const resolve = useCallback(
		(value: T | ((prev: T | undefined) => T)) => {
			setState((state) => {
				if (typeof value === 'function') {
					return asyncState.resolve(state, (value as (prev: T | undefined) => T)(state.value));
				}

				return asyncState.resolve(state, value);
			});
		},
		[setState],
	);

	const reject = useCallback(
		(error: Error) => {
			setState((state) => asyncState.reject(state, error));
		},
		[setState],
	);

	const update = useCallback(() => {
		setState((state) => asyncState.update(state));
	}, [setState]);

	const reset = useCallback(() => {
		setState((state) => asyncState.reload(state));
	}, [setState]);

	return useMemo(
		() => ({
			...state,
			resolve,
			reject,
			reset,
			update,
		}),
		[state, resolve, reject, reset, update],
	);
};

export { AsyncStatePhase, AsyncState };
