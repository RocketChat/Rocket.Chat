import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo, useState } from 'react';

import { AsyncStatePhase, AsyncState, asyncState } from '../lib/asyncState';

type AsyncStateObject<T> = AsyncState<T> & {
	resolve: (value: T | ((prev: T | undefined) => T)) => void;
	reject: (error: Error) => void;
	reset: () => void;
	update: () => void;
	mutate: (mutation: (prev: T | undefined) => Promise<T>) => void;
};

export const useAsyncState = <T>(initialValue?: T | (() => T)): AsyncStateObject<T> => {
	const [state, setState] = useSafely(
		useState<AsyncState<T>>(() => {
			if (typeof initialValue === 'undefined') {
				return asyncState.loading<T>();
			}

			return asyncState.resolved<T>(
				typeof initialValue === 'function'
					? (initialValue as () => T)()
					: initialValue,
			);
		}),
	);

	const mutate = useCallback((mutation: (prev: T | undefined) => Promise<T>): void => {
		setState((prev) => {
			mutation(asyncState.value(prev))
				.then((value) => setState((prev) => asyncState.resolve(prev, value)))
				.catch((error) => setState((prev) => asyncState.reject(prev, error)));

			return asyncState.update(prev);
		});
	}, [setState]);

	const resolve = useCallback((value: T | ((prev: T | undefined) => T)) => {
		setState(
			(state) =>
				asyncState.resolve(
					state,
					typeof value === 'function'
						? (value as (prev: T | undefined) => T)(state.value)
						: value,
				),
		);
	}, [setState]);

	const reject = useCallback((error: Error) => {
		setState((state) => asyncState.reject(state, error));
	}, [setState]);


	const update = useCallback(() => {
		setState((state) => asyncState.update(state));
	}, [setState]);

	const reset = useCallback(() => {
		setState((state) => asyncState.reload(state));
	}, [setState]);

	return useMemo(() => ({
		...state,
		resolve,
		reject,
		reset,
		update,
		mutate,
	}), [state, resolve, reject, reset, update, mutate]);
};

export {
	AsyncStatePhase,
	AsyncState,
};
