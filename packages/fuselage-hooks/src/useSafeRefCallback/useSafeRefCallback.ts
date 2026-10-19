import { useMemo } from 'react';

export type SafeCallbackRef<T> = (node: T) => (() => void) | void;

/**
 * useSafeRefCallback will call a cleanup function (returned from the passed callback)
 * whenever the component is re-rendered ( similar to useEffect, but in a callbackRef )
 *
 * Caveat: Usually, callback refs are called with `null` when the component is unmounted. The returned callback from this hook will only be called whenever `node !== null`.
 *  For cases where you want to do some action when the node is null, you should rely on the cleanup function to be called.
 *
 * @example
 *   const callback = useSafeRefCallback(
 *       useCallback(
 *            // node will always exist
 *           (node: HTMLDivElement) => {
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
export const useSafeRefCallback = <T extends HTMLElement>(callback: SafeCallbackRef<T>) =>
	useMemo(() => {
		let cleanup: (() => void) | null = null;

		return (node: T | null): void => {
			if (node === null) {
				if (typeof cleanup === 'function') {
					cleanup();
					cleanup = null;
				}
				return;
			}

			cleanup = callback(node) || null;
		};
	}, [callback]);
