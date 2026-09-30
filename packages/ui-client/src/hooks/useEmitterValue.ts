import { useCallback, useSyncExternalStore } from 'react';

type EventSource<TEvent> = {
	on(event: TEvent, handler: () => void): unknown;
	off(event: TEvent, handler: () => void): unknown;
};

/**
 * Reads a value from an event source, re-rendering whenever `event` fires.
 * `getSnapshot` must return the same value between events, as with `useSyncExternalStore`.
 */
export const useEmitterValue = <TEvent, TValue>(emitter: EventSource<TEvent>, event: TEvent, getSnapshot: () => TValue): TValue => {
	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			emitter.on(event, onStoreChange);
			return () => {
				emitter.off(event, onStoreChange);
			};
		},
		[emitter, event],
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
