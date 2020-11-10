import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const enum AsyncStatePhase {
	LOADING = 'loading',
	RESOLVED = 'resolved',
	REJECTED = 'rejected',
}

export type AsyncState<T> = (
	{ phase: AsyncStatePhase.LOADING; value: undefined; error: undefined } |
	{ phase: AsyncStatePhase.LOADING; value: T; error: undefined } |
	{ phase: AsyncStatePhase.LOADING; value: undefined; error: Error } |
	{ phase: AsyncStatePhase.RESOLVED; value: T; error: undefined } |
	{ phase: AsyncStatePhase.REJECTED; value: undefined; error: Error }
);

type AsyncStateObject<T> = AsyncState<T> & {
	resolve: (value: T | ((prev: T | undefined) => T)) => void;
	reject: (error: Error) => void;
	reset: () => void;
};

export const useAsyncState = <T>(initialValue?: T | (() => T)): AsyncStateObject<T> => {
	const [state, setState] = useState<AsyncState<T>>(() => {
		if (typeof initialValue === 'undefined') {
			return {
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: undefined,
			};
		}

		return {
			phase: AsyncStatePhase.RESOLVED,
			value: typeof initialValue === 'function'
				? (initialValue as () => T)()
				: initialValue,
		};
	});

	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		return (): void => {
			isMountedRef.current = false;
		};
	}, []);

	const resolve = useCallback((value: T | ((prev: T | undefined) => T)) => {
		if (!isMountedRef.current) {
			return;
		}

		setState((state) => {
			if (state.phase !== AsyncStatePhase.LOADING) {
				return state;
			}

			return {
				phase: AsyncStatePhase.RESOLVED,
				value: typeof value === 'function' ? (value as (prev: T | undefined) => T)(state.value) : value,
				error: undefined,
			};
		});
	}, []);

	const reject = useCallback((error: Error) => {
		if (!isMountedRef.current) {
			return;
		}

		setState((state) => {
			if (state.phase !== AsyncStatePhase.LOADING) {
				return state;
			}

			return {
				phase: AsyncStatePhase.REJECTED,
				value: undefined,
				error,
			};
		});
	}, []);

	const reset = useCallback(() => {
		if (!isMountedRef.current) {
			return;
		}

		setState((state) => {
			switch (state.phase) {
				case AsyncStatePhase.LOADING:
					return state;

				case AsyncStatePhase.RESOLVED:
					return {
						phase: AsyncStatePhase.LOADING,
						value: state.value,
						error: state.error,
					};

				case AsyncStatePhase.REJECTED:
					return {
						phase: AsyncStatePhase.LOADING,
						value: undefined,
						error: state.error,
					};
			}
		});
	}, []);

	return useMemo(() => ({
		...state,
		resolve,
		reject,
		reset,
	}), [state, resolve, reject, reset]);
};
