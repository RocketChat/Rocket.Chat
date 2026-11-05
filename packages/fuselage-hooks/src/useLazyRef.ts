import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

const EMPTY = Symbol('empty');

const useBrowserLazyRef = <T>(init: () => T): RefObject<T> => {
	const ref = useRef<typeof EMPTY | T>(EMPTY);

	useLayoutEffect(() => {
		if (ref.current === EMPTY) {
			ref.current = init();
		}
	}, [init]);

	return ref as RefObject<T>;
};

const useServerLazyRef = <T>(init: () => T): RefObject<T> => useRef(init());

/**
 * Hook equivalent to useRef, but with a lazy initialization for computed value.
 *
 * @param init - the function the computes the ref value
 * @returns the ref
 * @public
 */
export const useLazyRef = typeof window !== 'undefined' && window.document ? useBrowserLazyRef : useServerLazyRef;
