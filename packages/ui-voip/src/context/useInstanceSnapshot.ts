import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * A value read from the call instance, kept current as its session state changes. The same value is returned for as
 * long as `isEqual` holds, so readers are not rendered for a state change that did not change what they read.
 */
export const useInstanceSnapshot = <T>(
	instance: MediaSignalingSession | undefined,
	read: (instance: MediaSignalingSession | undefined) => T,
	isEqual: (a: T, b: T) => boolean = Object.is,
): T => {
	const cache = useRef<{ value: T }>(undefined);

	const subscribe = useCallback(
		(onStoreChange: () => void) => (instance ? instance.on('sessionStateChange', onStoreChange) : () => undefined),
		[instance],
	);

	const getSnapshot = () => {
		const next = read(instance);
		if (cache.current && isEqual(cache.current.value, next)) {
			return cache.current.value;
		}
		cache.current = { value: next };
		return next;
	};

	return useSyncExternalStore(subscribe, getSnapshot);
};
