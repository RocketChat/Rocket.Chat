import { useCallback, useSyncExternalStore } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';

export type PeekMediaSessionCallIdReturn = string | undefined;

export const usePeekMediaSessionCallId = (): PeekMediaSessionCallIdReturn => {
	const { instance } = useMediaCallInstance();

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			if (!instance) {
				return () => undefined;
			}
			return instance?.on('sessionStateChange', onStoreChange);
		},
		[instance],
	);

	const getSnapshot = useCallback(() => {
		return instance?.getState()?.tempCallId || undefined;
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
