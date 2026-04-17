import { useCallback, useRef, useSyncExternalStore } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import type { PeerInfo } from './definitions';
import { derivePeerInfoFromInstanceState } from '../utils/derivePeerInfoFromInstanceState';

const areEqual = (a: PeerInfo, b: PeerInfo) => {
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}
	return Object.keys(a).every((key) => a[key as keyof PeerInfo] === b[key as keyof PeerInfo]);
};

export const usePeekMediaSessionPeerInfo = (): PeerInfo | undefined => {
	const { instance } = useMediaCallInstance();
	const cache = useRef<PeerInfo | undefined>(undefined);

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
		if (!instance) {
			return undefined;
		}
		const instanceState = instance.getState();
		if (!instanceState) {
			return undefined;
		}
		const peerInfo = derivePeerInfoFromInstanceState(instanceState);

		if (!cache.current || !areEqual(peerInfo, cache.current)) {
			cache.current = peerInfo;
			return peerInfo;
		}
		return cache.current;
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
