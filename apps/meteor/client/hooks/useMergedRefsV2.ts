import type { MutableRefObject, Ref, RefCallback } from 'react';
import { useCallback } from 'react';

const isRefCallback = <T>(x: unknown): x is RefCallback<T> => typeof x === 'function';
const isMutableRefObject = <T>(x: unknown): x is MutableRefObject<T> => typeof x === 'object';

export const setRef = <T>(ref: Ref<T> | undefined, refValue: T) => {
	if (isRefCallback<T>(ref)) {
		ref(refValue);
		return;
	}

	if (isMutableRefObject<T>(ref)) {
		ref.current = refValue;
	}
};

// TODO: backport to fuselage-hooks
/**
 * Merges multiple refs into a single ref callback
 *
 * @param refs The refs to merge.
 * @returns The merged ref callback.
 */
export const useMergedRefsV2 = <T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> => {
	return useCallback((refValue: T) => {
		refs.forEach((ref) => setRef(ref, refValue));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, refs);
};
