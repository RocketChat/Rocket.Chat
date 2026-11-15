import type { Ref, RefCallback, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

const isRefCallback = <T>(x: unknown): x is RefCallback<T> => typeof x === 'function';
const isRefObject = <T>(x: unknown): x is RefObject<T> => typeof x === 'object';

/**
 * Hook to merge refs and callbacks refs into a single callback ref. Useful when your component need a internal ref
 * while receiving a forwared ref.
 *
 * @param refs - the refs and callback refs that should be merged
 * @return a merged callback ref
 * @public
 */
export const useMergedRefs = <T>(...refs: (Ref<T> | null | undefined)[]): RefCallback<T> => {
	const refsRef = useRef(refs);

	useIsomorphicLayoutEffect(() => {
		refsRef.current = refs;
	});

	return useCallback((refValue: T) => {
		const refs = refsRef.current;

		refs.filter(Boolean).forEach((ref) => {
			if (isRefCallback<T>(ref)) {
				ref(refValue);
				return;
			}

			if (isRefObject<T>(ref)) {
				ref.current = refValue;
			}
		});
	}, []);
};
