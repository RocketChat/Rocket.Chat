import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AsyncState<T> = (
	{ phase: 'loading'; value: undefined; error: undefined } |
	{ phase: 'loading'; value: T; error: undefined } |
	{ phase: 'loading'; value: undefined; error: Error } |
	{ phase: 'resolved'; value: T; error: undefined } |
	{ phase: 'rejected'; value: undefined; error: Error }
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
				phase: 'loading',
				value: undefined,
				error: undefined,
			};
		}

		return {
			phase: 'resolved',
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
			if (state.phase !== 'loading') {
				return state;
			}

			return {
				phase: 'resolved',
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
			if (state.phase !== 'loading') {
				return state;
			}

			return {
				phase: 'rejected',
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
				case 'loading':
					return state;

				case 'resolved':
					return {
						phase: 'loading',
						value: state.value,
						error: state.error,
					};

				case 'rejected':
					return {
						phase: 'loading',
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
