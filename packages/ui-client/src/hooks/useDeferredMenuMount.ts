import { useCallback, useEffect, useRef, useState } from 'react';

type IdleHandle = { type: 'idle' | 'timeout'; id: number };

const schedule = (fn: () => void): IdleHandle => {
	if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
		return { type: 'idle', id: window.requestIdleCallback(fn, { timeout: 200 }) };
	}
	return { type: 'timeout', id: window.setTimeout(fn, 50) };
};

const cancel = (handle: IdleHandle) => {
	if (handle.type === 'idle' && typeof window.cancelIdleCallback === 'function') {
		window.cancelIdleCallback(handle.id);
		return;
	}
	window.clearTimeout(handle.id);
};

/**
 * Defers mounting a list row's menu until the browser is idle, so pointing at or clicking a row
 * does not pay for its menu in the same task. Focus mounts it right away.
 */
export const useDeferredMenuMount = () => {
	const [mounted, setMounted] = useState(typeof window !== 'undefined' && !!window.DISABLE_ANIMATION);
	const handleRef = useRef<IdleHandle | undefined>(undefined);

	const requestMount = useCallback(() => {
		if (mounted || handleRef.current !== undefined) {
			return;
		}
		handleRef.current = schedule(() => {
			handleRef.current = undefined;
			setMounted(true);
		});
	}, [mounted]);

	const mountNow = useCallback(() => {
		if (handleRef.current !== undefined) {
			cancel(handleRef.current);
			handleRef.current = undefined;
		}
		setMounted(true);
	}, []);

	useEffect(
		() => () => {
			if (handleRef.current !== undefined) {
				cancel(handleRef.current);
				handleRef.current = undefined;
			}
		},
		[],
	);

	return { mounted, requestMount, mountNow };
};
