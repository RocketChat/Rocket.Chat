import { useMemo } from 'react';

type CallbackRefWithCleanup<T> = (node: T) => () => void;
type CallbackRef<T> = (node: T) => void;

type SafeCallbackRef<T> = CallbackRefWithCleanup<T> | CallbackRef<T>;

/**
 * useSafeRefCallback will call a cleanup function (returned from the passed callback)
 * if the passed callback is called multiple times (similar to useEffect, but in a callbackRef)
 *
 * @example
 *   const callback = useSafeRefCallback(
 *       useCallback(
 *           (node: T) => {
 *               if (!node) {
 *                   return;
 *               }
 *               node.addEventListener('click', listener);
 *               return () => {
 *                   node.removeEventListener('click', listener);
 *               };
 *           },
 *           [listener],
 *       ),
 *   );
 *
 */
export const useSafeRefCallback = <T extends HTMLElement | null>(callback: SafeCallbackRef<T>) => {
	const callbackRef = useMemo(() => {
		let _cleanup: (() => void) | null;

		return (node: T): void => {
			if (typeof _cleanup === 'function') {
				_cleanup();
			}
			const cleanup = callback(node);

			_cleanup = cleanup || null;
		};
	}, [callback]);

	return callbackRef;
};
