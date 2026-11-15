import type { Ref, RefCallback } from 'react';
import { useCallback, useRef } from 'react';

/**
 * Attaches a value to a ref, the way React would, and returns what detaches it again.
 */
export const setRef = <T>(ref: Ref<T> | undefined, refValue: T): (() => void) => {
	if (typeof ref === 'function') {
		const cleanup = ref(refValue);
		return typeof cleanup === 'function' ? cleanup : () => ref(null);
	}

	if (ref) {
		ref.current = refValue;
		return () => {
			ref.current = null;
		};
	}

	return () => undefined;
};

// TODO: backport to fuselage-hooks
/**
 * Merges multiple refs into a single ref callback, forwarding the cleanup each of them returns.
 *
 * The merged ref also tears down when it is called with `null`, so it keeps working inside components that merge it
 * again with a ref helper unaware of cleanup functions.
 *
 * @param refs The refs to merge.
 * @returns The merged ref callback.
 */
export const useMergedRefsV2 = <T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> => {
	const detachRef = useRef<() => void>(undefined);

	return useCallback((refValue: T | null) => {
		detachRef.current?.();

		if (refValue === null) {
			return;
		}

		const cleanups = refs.map((ref) => setRef(ref, refValue));
		const detach = () => {
			if (detachRef.current !== detach) {
				return;
			}

			detachRef.current = undefined;
			cleanups.forEach((cleanup) => cleanup());
		};
		detachRef.current = detach;

		return detach;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, refs);
};
