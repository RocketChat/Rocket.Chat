import type { DependencyList } from 'react';
import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Hook to memoize a debounced version of a callback.
 *
 * @param callback - the callback to debounce
 * @param delay - the number of milliseconds to delay
 * @param deps - the hook dependencies
 * @returns a memoized and debounced callback
 * @public
 */
export const useDebouncedCallback = <P extends unknown[]>(
	callback: (...args: P) => unknown,
	delay: number,
	deps?: DependencyList,
): ((...args: P) => unknown) & {
	flush: () => void;
	cancel: () => void;
} => {
	// eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
	const effectiveCallback = deps ? useMemo(() => callback, deps) : callback;

	const timerCallbackRef = useRef<() => void>(undefined);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const debouncedCallback = useCallback(
		(...args: P) => {
			timerCallbackRef.current = (): void => {
				effectiveCallback(...args);
			};
			clearTimeout(timerRef.current);
			timerRef.current = setTimeout(timerCallbackRef.current, delay);
		},
		[effectiveCallback, delay],
	);

	const flush = useCallback(() => {
		clearTimeout(timerRef.current);
		timerCallbackRef.current?.();
	}, []);

	const cancel = useCallback(() => {
		clearTimeout(timerRef.current);
	}, []);

	useEffect(
		() => () => {
			cancel();
		},
		[cancel],
	);

	return useMemo(() => Object.assign(debouncedCallback, { flush, cancel }), [debouncedCallback, flush, cancel]);
};
